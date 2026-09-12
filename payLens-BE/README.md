# payLens — Salary Management (Backend)

Employee salary management backend for the Incubyte "Salary Management Assessment". Built for a single HR Manager persona to manage base salaries of ~10,000 employees across countries and answer pay questions through structured analytics.

This document is the **source of truth for backend scope, architecture, and conventions**. UI is tracked separately.

---

## MVP trade-offs at a glance

| Concern | Decision | Rationale |
|---|---|---|
| **Salary storage** | Current salary only, in the **employee's native currency** | Assessment defers salary history / effective-dated revisions. `Employee` mutates in place. |
| **Reporting currency** | Analytics normalise to **USD** using deterministic seeded FX rates | Static `fx_rate` table (Flyway `V2`), never updated at runtime. |
| **`UpdateCompensationRequest.reason`** | Accepted in the API contract but **not persisted** | Salary audit / history is intentionally out of scope for the MVP. Keeping the field in the contract makes it an additive change to introduce an audit table later. |
| **Authentication / RBAC / SSO** | **Out of scope for the MVP.** The backend assumes an already-authorised HR Manager persona. Adding Spring Security in front of the current controllers is a bolt-on change that requires **no controller / service / DTO rewrite**. | Assessment explicitly allows this. |
| **In-product AI (NLQ / embeddings)** | **Not built.** AI-assisted development is documented but the product surface exposes only structured analytics endpoints. | Assessment marks AI as optional. |
| **Infrastructure** | Single Spring Boot process + PostgreSQL. **No Redis, Kafka, Elasticsearch, or microservices.** | Nothing at 10k rows justifies extra infra. |

See [`docs/architecture-decisions.md`](docs/architecture-decisions.md) for the full ADR log.

---

## Analytics / Compensation Insights API

Base path:

```text
/api/analytics
```

Reporting currency:

- All monetary analytics values are normalized to `USD`
- Source salaries remain stored in native employee currency
- FX rates come from the static seeded `fx_rate` table (assessment/demo rates, not live market rates)

Common filter query parameters (composable):

- `country`
- `department`
- `role` (alias of `jobTitle`)
- `jobTitle`

If both `role` and `jobTitle` are provided, they must match.

### 1) Summary

```text
GET /api/analytics/summary
```

Response fields:

- `totalEmployees`
- `totalPayroll`
- `averageSalary`
- `medianSalary`
- `reportingCurrency`

Example:

```json
{
  "totalEmployees": 1250,
  "totalPayroll": 18500000.00,
  "averageSalary": 14800.00,
  "medianSalary": 13200.00,
  "reportingCurrency": "USD"
}
```

### 2) Salary Distribution

```text
GET /api/analytics/salary-distribution
```

Buckets (USD-normalized):

- `0-50K`
- `50K-100K`
- `100K-150K`
- `150K-200K`
- `200K+`

Example:

```json
[
  { "range": "0-50K", "employeeCount": 1250 },
  { "range": "50K-100K", "employeeCount": 3200 }
]
```

### 3) Grouped Analytics

```text
GET /api/analytics/by-country
GET /api/analytics/by-department
GET /api/analytics/by-role
```

Each endpoint returns per-group:

- group key (`country` or `department` or `jobTitle`)
- `employeeCount`
- `totalPayroll` (USD)
- `averageSalary` (USD)
- `medianSalary` (USD)
- `reportingCurrency`

### Calculation Notes

- **Normalization first**: `usd_salary = employee.current_salary / fx.rate_to_usd`
- **Total payroll**: `SUM(usd_salary)`
- **Average salary**: `AVG(usd_salary)`
- **Median salary**: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY usd_salary)`
  - PostgreSQL computes continuous percentile; for even row counts this interpolates the middle pair (for example `1000,2000,3000,4000 -> 2500`)

### Empty Result Behavior

- Summary returns:
  - `totalEmployees = 0`
  - `totalPayroll = 0.00`
  - `averageSalary = 0.00`
  - `medianSalary = 0.00`
  - `reportingCurrency = "USD"`
- Grouped endpoints return `[]`

### Performance Notes

- Aggregation, filtering, grouping, and median are all database-side queries
- Backend returns only aggregated result sets to Java
- Existing indexes on `employee(country)`, `employee(department)`, `employee(job_title)` support filter/group patterns
- No extra index was added on `employee.currency` because join is against tiny `fx_rate` and observed workload is 10k rows

---

## 1. Product scope (MVP)

**In scope**
- Base salary only, stored in the employee's **native currency**.
- Current salary only — updates mutate the existing employee record in place.
- Server-side pagination, filtering, sorting, and search for the employee list.
- PostgreSQL-backed analytics for total payroll, average salary, median salary, salary distribution, and breakdowns by country / department / role.
- Deterministic seed data for exactly **10,000 employees** plus static FX rates.
- Consistent JSON DTOs and a single shared error contract for Angular integration.

**Explicitly out of scope**
- Salary history, audit logging, bonuses, equity, and approval workflows.
- Authentication, RBAC, SSO, OAuth, JWT, or permission systems.
- Live FX feeds, caching, Redis, Elasticsearch, Kafka, microservices, or CQRS.
- In-product AI querying.

---

## 2. Architecture

**Style:** feature-oriented modular monolith with classic layering.

```text
Controller
    ↓
Service
    ↓
Repository / Query
    ↓
PostgreSQL
```

**Current packages under `com.incubyte.paylens`:**
- `common` — shared API DTOs and exception handling.
- `config` — framework configuration (`WebConfig` for CORS).
- `employee` — `Employee` entity, repository/specifications, read service, compensation update service, deterministic seed runner, REST DTOs and controller.
- `currency` — seeded `FxRate` entity/repository and `CurrencyConverter`.
- `analytics` — REST/controller DTOs, read-only service, JDBC/native SQL query repository.

**Runtime characteristics**
- Single Spring Boot application.
- Servlet stack (`spring-boot-starter-webmvc`).
- PostgreSQL in all environments.
- Flyway-managed schema in dev, test, docker, and prod.

---

## 3. Current data model

**Employee**
- `id`
- `version` (`@Version` optimistic locking)
- `employeeNumber`
- `firstName`
- `lastName`
- `jobTitle`
- `department`
- `country`
- `employmentStatus`
- `currentSalary` (`BigDecimal` / `DECIMAL(19,2)`)
- `currency` (`CHAR(3)`, FK to `fx_rate.currency`)

**FxRate**
- `id`
- `currency` (`CHAR(3)`, unique)
- `rateToUsd` (`BigDecimal` / `DECIMAL(10,6)`)

**Important scope decisions**
- No salary history table.
- No department/country/role reference tables.
- Analytics normalise employee-native salaries to **USD** at query time.

---

## 4. Database

Schema is managed by Flyway under `src/main/resources/db/migration`:

- `V1__create_employee_table.sql`
- `V2__create_fx_rate_table.sql`
- `V3__add_employee_version_column.sql`
- `V4__add_employee_currency_fk.sql`

Key indexes currently present:
- `employee(employee_number)` unique
- `employee(country)`
- `employee(department)`
- `employee(job_title)`
- `employee(employment_status)`
- `employee(last_name, first_name)`
- `fx_rate(currency)` unique

---

## 5. API overview

Base path: `/api`

### Employees
- `GET /api/employees`
- `GET /api/employees/{id}`

### Compensation
- `PATCH /api/employees/{id}/compensation`

### Analytics
- `GET /api/analytics/summary`
- `GET /api/analytics/salary-distribution`
- `GET /api/analytics/by-country`
- `GET /api/analytics/by-department`
- `GET /api/analytics/by-role`

See [`docs/api-contract.md`](docs/api-contract.md) for the exact Angular-facing contract: parameters, request/response DTOs, examples, and status codes.

**Conventions**
- All responses use explicit DTOs; JPA entities are never exposed.
- Monetary values stay as JSON numbers backed by `BigDecimal`.
- Error responses use `ApiError`:
  `{ timestamp, status, error, code, message, details[] }`.
- Employee list pagination uses `PageResponse<T>`:
  `{ content, page, pageSize, totalElements, totalPages }`.

---

## 6. Validation, errors, and CORS

- `UpdateCompensationRequest` uses Bean Validation:
  - `newSalary` required and `> 0`
  - `currency` required
  - `reason` required
- `Employee id`, `page`, `pageSize`, `sortBy`, and `sortDirection` are validated at the controller/service boundary.
- `GlobalExceptionHandler` maps:
  - `400 BAD_REQUEST`
  - `404 NOT_FOUND`
  - `409 CONFLICT`
  - `500 INTERNAL_SERVER_ERROR`
- Validation errors are returned in a predictable `details[]` list such as:
  - `currency: currency is required`
  - `newSalary: newSalary must be greater than zero`
- CORS is enabled only for `/api/**` and only for the configured origin:
  - property: `paylens.web.cors.allowed-origin`
  - default: `http://localhost:4200`

**OpenAPI status**
- Swagger / OpenAPI is **not currently configured** in this backend.
- The supported contract is documented in [`docs/api-contract.md`](docs/api-contract.md).

---

## 7. Seed data

- `EmployeeSeedRunner` is activated by `paylens.employee.seed.enabled=true`.
- Generates exactly **10,000 employees** with fixed `Random(42L)` determinism.
- Idempotent: if employees already exist, it does nothing.
- FX rates are seeded by Flyway `V2`, not by runtime code.

---

## 8. Testing strategy

- **Unit tests:** `EmployeeServiceTest`, `CompensationServiceTest`, `AnalyticsServiceTest`, `CurrencyConverterTest`.
- **API/controller tests:** `EmployeeControllerTest`, `EmployeeCompensationApiIntegrationTest`, `AnalyticsControllerIntegrationTest`.
- **Repository/database tests:** `EmployeeRepositoryTest`, `EmployeeConstraintsTest`, `FxRateRepositoryTest`, `AnalyticsQueryRepositoryTest`.
- **Seed/integration tests:** `EmployeeSeedRunnerTest`, `SeedDataIntegrityTest`.
- Tests use **Testcontainers PostgreSQL 17** + Flyway migrations + `ddl-auto=validate` for schema parity.

---

## 9. Running the backend

Requires JDK 21.

```bash
cd /Users/dbzpxuw/Documents/personal/payLens-project/payLens-BE
docker-compose up -d

export SPRING_PROFILES_ACTIVE=dev
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
export PAYLENS_DATASOURCE_USERNAME=paylens
export PAYLENS_DATASOURCE_PASSWORD=paylens
./gradlew bootRun
```

Run with deterministic seed data:

```bash
cd /Users/dbzpxuw/Documents/personal/payLens-project/payLens-BE
docker-compose up -d

export SPRING_PROFILES_ACTIVE=dev
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
export PAYLENS_DATASOURCE_USERNAME=paylens
export PAYLENS_DATASOURCE_PASSWORD=paylens
export PAYLENS_EMPLOYEE_SEED_ENABLED=true
./gradlew bootRun
```

---

## 10. Tests and API documentation

Run the full backend test suite:

```bash
cd /Users/dbzpxuw/Documents/personal/payLens-project/payLens-BE
./gradlew test
./gradlew build
```

Developer-facing API documentation:
- Contract guide: [`docs/api-contract.md`](docs/api-contract.md)
- ADRs: [`docs/architecture-decisions.md`](docs/architecture-decisions.md)

There is currently **no generated Swagger/OpenAPI UI** in this project.

---

## 11. What we intentionally will NOT build

- Salary history / effective-dated changes.
- Bonuses, equity, allowances, CTC.
- Live FX integration.
- Auth, SSO, RBAC.
- Microservices, Kafka, Redis, or external caches.
- In-product AI/NLQ.

These are called out so reviewers can distinguish "missing" from "explicitly deferred".


---

## PostgreSQL Configuration & Setup

### Environment Configuration

The application uses environment variables for database connection (no hardcoded credentials):

```bash
# Default values (used if not set)
PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
PAYLENS_DATASOURCE_USERNAME=paylens
PAYLENS_DATASOURCE_PASSWORD=paylens
```

**Override for production:**
```bash
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://prod-db-host:5432/paylens-prod
export PAYLENS_DATASOURCE_USERNAME=prod_user
export PAYLENS_DATASOURCE_PASSWORD=<secure-password>
export SPRING_PROFILES_ACTIVE=prod
./gradlew bootRun
```

### Database Schema

Two main tables created via Flyway migrations:

#### 1. `employee` table
Stores base salary data in native local currency.

```sql
CREATE TABLE employee (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    employment_status VARCHAR(30) NOT NULL,
    current_salary DECIMAL(19, 2) NOT NULL,  -- BASE SALARY ONLY
    currency CHAR(3) NOT NULL,                -- ISO 4217 code
    CONSTRAINT ck_employee_salary_positive CHECK (current_salary > 0),
    CONSTRAINT ck_employee_currency_length CHECK (length(currency) = 3)
);
```

**Key design decisions:**
- `current_salary` is `DECIMAL(19, 2)` — exact numeric type, never floating-point
- Scale of 2 ensures currency precision for all supported currencies
- `CHECK` constraint enforces positive salaries at the database layer
- `currency` stored as 3-char ISO code (e.g., "INR", "USD", "GBP")
- Employee's native salary is preserved; currency conversion happens at query time for reporting

#### 2. `fx_rate` table
Static FX rates for normalizing salaries to USD in analytics.

```sql
CREATE TABLE fx_rate (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    currency CHAR(3) NOT NULL UNIQUE,
    rate_to_usd DECIMAL(10, 6) NOT NULL,
    CONSTRAINT ck_fx_rate_positive CHECK (rate_to_usd > 0)
);
```

**Seeded rates (representative, constant for determinism):**
- USD: 1.000000
- INR: 83.000000
- GBP: 1.270000
- EUR: 1.100000
- CAD: 1.360000
- AUD: 1.530000
- SGD: 0.740000
- JPY: 149.000000

### Indexes

Indexes on common query patterns (all employees filtered by country/department/role):

```sql
CREATE UNIQUE INDEX idx_employee_employee_number ON employee (employee_number);
CREATE INDEX idx_employee_country ON employee (country);
CREATE INDEX idx_employee_department ON employee (department);
CREATE INDEX idx_employee_job_title ON employee (job_title);
CREATE INDEX idx_employee_employment_status ON employee (employment_status);
CREATE INDEX idx_employee_last_name_first_name ON employee (last_name, first_name);

CREATE UNIQUE INDEX idx_fx_rate_currency ON fx_rate (currency);
```

**Index decisions:**
- `employee_number` is unique, enabling O(1) lookups
- Single-column indexes on commonly filtered fields support WHERE clauses efficiently
- Composite index on `(last_name, first_name)` supports name-based search and sort
- No composite index on `(country, department)` — single indexes usually sufficient for 10k rows

### Database Constraints

**Data integrity enforced at the database layer:**

1. **Unique employee numbers**: Prevents duplicate employee records
2. **Positive salaries**: CHECK constraint `current_salary > 0` ensures no zero/negative pay
3. **Positive FX rates**: CHECK constraint `rate_to_usd > 0` ensures valid conversion ratios
4. **Required fields**: NOT NULL constraints on business-critical columns
5. **Unique FX currency codes**: Only one rate per currency

### Migration Strategy (Flyway)

Migrations are version-controlled SQL files in `src/main/resources/db/migration/`:

- **V1__create_employee_table.sql** — Initial employee schema with indexes and constraints
- **V2__create_fx_rate_table.sql** — FX rate table with 8 seeded currencies
- **V3__add_employee_version_column.sql** — `@Version` column for optimistic locking
- **V4__add_employee_currency_fk.sql** — FK from `employee.currency` → `fx_rate.currency`
  (belt-and-braces guarantee that no employee can be inserted with a currency that has no FX rate)

**Idempotent application startup:**
1. Flyway automatically discovers migrations
2. Checks schema version table; skips applied migrations
3. Only new/pending migrations are run
4. Application validates schema matches Hibernate mappings (`ddl-auto: validate`)

**Local development workflow:**
```bash
# Migrations run automatically on startup
./gradlew bootRun
# Check schema with psql (example)
psql -h localhost -U paylens -d paylens -c "\\dt"
```

### Deterministic Seed Data

The application can seed exactly 10,000 employees on startup:

**Activation:**
```bash
export PAYLENS_EMPLOYEE_SEED_ENABLED=true
./gradlew bootRun
```

**Seed behavior:**
- Uses a **fixed random seed** (`SEED = 42L`) ensuring reproducible data across runs
- Generates employee records with deterministic name, salary, and distribution
- Idempotent: checks `SELECT COUNT(*) FROM employee`; if ≥ 10,000 records exist, skips seeding
- Runs in a single transaction for consistency

**Data generation:**
- **Employee numbers**: `EMP-00001` through `EMP-10000` (deterministic format)
- **Names**: Cycled from a fixed list of first/last names
- **Countries**: 8 countries with realistic distribution (India, USA, UK, Germany, Canada, Australia, Singapore, Japan)
- **Currencies**: Aligned to country; validated against FX rate table
- **Departments**: 7 departments (Engineering, Product, Finance, People, Sales, Operations, Support)
- **Job titles**: 9 roles with seniority differentiation (Software Engineer, Senior Software Engineer, Manager, etc.)
- **Employment status**: ~96.5% ACTIVE, ~3% ON_LEAVE, ~0.5% TERMINATED
- **Salaries**: Base salary adjusted by:
  - Country multiplier (currency-based living cost adjustment)
  - Seniority level (Senior roles earn more)
  - Department premium (e.g., Engineering gets +10k USD base)
  - Random variation within role range (±25%)

**Example seeded employee:**
```json
{
  "id": 1,
  "employeeNumber": "EMP-00001",
  "firstName": "Ava",
  "lastName": "Patel-1",
  "jobTitle": "Software Engineer",
  "department": "Engineering",
  "country": "India",
  "employmentStatus": "ACTIVE",
  "currentSalary": 1237500.00,
  "currency": "INR"
}
```

### Validation & Data Integrity Tests

Tests verify seeded data quality:

- **SeedDataIntegrityTest** (44 assertions):
  - Exactly 10,000 employees seeded
  - No duplicate employee numbers
  - All required fields populated
  - All salaries positive with 2 decimal places
  - Multiple countries, departments, roles, currencies present
  - All used currencies have FX rates
  - FX rates are positive
  - Salaries are in plausible ranges for their currency
  - Deterministic seed produces consistent first employee

- **FxRateRepositoryTest**:
  - All required currencies exist
  - USD rate equals 1.000000
  - All rates are positive

- **CurrencyConverterTest**:
  - Converts amounts correctly
  - Handles case-insensitive currency codes
  - Rounds to 2 decimal places
  - Throws on unknown currency

### Performance Considerations

**Query patterns optimized:**

1. **List employees with filters** (most common):
   ```sql
   SELECT * FROM employee 
   WHERE country = ? AND department = ? AND employment_status = ?
   ORDER BY employee_number LIMIT 25 OFFSET 0;
   ```
   Uses indexes on `country`, `department`, `employment_status`.

2. **Search by name**:
   ```sql
   SELECT * FROM employee 
   WHERE LOWER(first_name) LIKE LOWER(?) OR LOWER(last_name) LIKE LOWER(?)
   ORDER BY last_name, first_name;
   ```
   Uses composite index on `(last_name, first_name)` for sorting; JPA criteria applies LOWER() at query layer.

3. **Analytics (aggregations)**:
   ```sql
   SELECT country, COUNT(*) as headcount, SUM(current_salary) as total_salary_native
   FROM employee
   GROUP BY country;
   ```
   Indexes on `country` support GROUP BY; aggregations computed in database (not Java).

**No performance issue at 10,000 rows:**
- All indexes fit in memory
- Queries return < 200 records per page (enforced limit)
- Pagination + sorting pushed to database layer
- No N+1 query problems (single entity, no relationships)

### Test Database Strategy

Repository, analytics, and integration tests run against a **real PostgreSQL 17 instance provisioned automatically by [Testcontainers](https://testcontainers.com/)** — no developer needs to start Postgres manually before `./gradlew test`.

**Configuration** (`src/test/resources/application.yaml`):
```yaml
spring:
  datasource:
    url: jdbc:tc:postgresql:17-alpine:///paylens   # Testcontainers "tc:" scheme
    driver-class-name: org.testcontainers.jdbc.ContainerDatabaseDriver
  jpa:
    hibernate:
      ddl-auto: validate                            # NOT create-drop: mappings must match Flyway
  flyway:
    enabled: true
    locations: classpath:db/migration
```

**What this guarantees:**

- Tests validate the **same Flyway migrations** used in production (`V1`…`V4`).
- Hibernate's `validate` mode fails fast if a JPA mapping drifts from the schema.
- FX rates are seeded by Flyway `V2`, so no separate test-only FX seeder is needed.
- One PostgreSQL container is reused across Spring test contexts; each test class cleans its own domain state.
- Unit tests (`EmployeeServiceTest`, `CompensationServiceTest`, `AnalyticsServiceTest`, `EmployeeControllerTest`) use Mockito only and do not start containers.

**First run:** Docker (or a compatible daemon) must be available on the developer machine or CI runner; the container image (`postgres:17-alpine`) is pulled once and cached.

> If you use **Colima** (or another non-Docker-Desktop daemon), Testcontainers may not auto-discover the socket. Export before running tests:
> ```bash
> export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
> export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE="/var/run/docker.sock"
> ```

### Local PostgreSQL Development Setup (Optional)

If you want to test against a real PostgreSQL instance locally:

1. **Install PostgreSQL** (macOS):
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

2. **Create a local database**:
   ```bash
   createdb paylens
   createuser paylens -P  # Will prompt for password
   psql paylens -c "GRANT ALL PRIVILEGES ON DATABASE paylens TO paylens;"
   ```

3. **Run the application against PostgreSQL**:
   ```bash
   export PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
   export PAYLENS_DATASOURCE_USERNAME=paylens
   export PAYLENS_DATASOURCE_PASSWORD=paylens
   export PAYLENS_EMPLOYEE_SEED_ENABLED=true
   ./gradlew bootRun
   ```

4. **Verify data**:
   ```bash
   psql paylens -c "SELECT COUNT(*) FROM employee;"  # Should show 10,000
   psql paylens -c "SELECT * FROM fx_rate;"
   ```

5. **Reset database** (if needed):
   ```bash
   dropdb paylens
   createdb paylens
   ```

---

## Build & Run

Requires **JDK 21**. Uses Gradle wrapper.

```bash
# Compile and test (uses PostgreSQL via Testcontainers)
./gradlew test

# Build JAR
./gradlew build

# Run locally (PostgreSQL, seed disabled by default)
./gradlew bootRun

# Run with seeding enabled
export PAYLENS_EMPLOYEE_SEED_ENABLED=true
./gradlew bootRun

# Run against PostgreSQL
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
export PAYLENS_DATASOURCE_USERNAME=paylens
export PAYLENS_DATASOURCE_PASSWORD=paylens
export PAYLENS_EMPLOYEE_SEED_ENABLED=true
./gradlew bootRun
```

**Key endpoints when running locally:**
- **API**: http://localhost:8080/api/employees
- **API contract**: `docs/api-contract.md`
- **PostgreSQL logs**: `docker-compose logs -f postgres`

---

## Spring Profiles & Configuration

The application supports four Spring profiles: **dev**, **test**, **prod**, and **docker**. Each profile has its own configuration file optimized for its environment.

### Profile Overview

| Profile | Database | Use Case | Auto-seed | Logging | Pool Size |
|---------|----------|----------|-----------|---------|-----------|
| **dev** | PostgreSQL (localhost:5432) | Local development | false | DEBUG | 10 |
| **test** | PostgreSQL via **Testcontainers** (`postgres:17-alpine`) | Unit & integration tests | false | WARN | default |
| **prod** | PostgreSQL (production) | Production deployment | false | WARN | 20 |
| **docker** | PostgreSQL (docker network host `postgres`) | Running app in Docker network | false | INFO | 10 |

### Configuration Files

```
src/main/resources/
├── application.yaml              # Base config (default)
├── application-dev.yaml          # Development overrides
├── application-docker.yaml       # Docker-network overrides
├── application-test.yaml         # Test overrides
└── application-prod.yaml         # Production overrides
```

### Running with Different Profiles

#### Development (Default)
```bash
# Uses application-dev.yaml
# Connects to local PostgreSQL
./gradlew bootRun

# Or explicitly:
export SPRING_PROFILES_ACTIVE=dev
./gradlew bootRun

# With seeding enabled (10,000 employees):
export SPRING_PROFILES_ACTIVE=dev
export PAYLENS_EMPLOYEE_SEED_ENABLED=true
./gradlew bootRun
```

**Dev profile features:**
- PostgreSQL on `localhost:5432`
- Flyway migrations run automatically
- DEBUG logging for troubleshooting
- Connection pool max size `10`
- SQL formatting enabled for readability

#### Test
```bash
# Uses application-test.yaml
# Automatic; no need to set profile
./gradlew test

# Or if running specific tests:
export SPRING_PROFILES_ACTIVE=test
./gradlew test
```

**Test profile features:**
- PostgreSQL via **Testcontainers** (`jdbc:tc:postgresql:17-alpine:///paylens`)
- Flyway migrations run before Hibernate validation
- `ddl-auto: validate` to catch schema drift against the real migrations
- WARN logging (minimal noise)
- No H2 and no in-memory DB behavior drift

#### Production
```bash
# Requires environment variables; no defaults
export SPRING_PROFILES_ACTIVE=prod
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://prod-db-host:5432/paylens-prod
export PAYLENS_DATASOURCE_USERNAME=paylens_user
export PAYLENS_DATASOURCE_PASSWORD=<secure-password>
./gradlew bootRun

# Or from Docker:
docker run -e SPRING_PROFILES_ACTIVE=prod \
  -e PAYLENS_DATASOURCE_URL=... \
  -e PAYLENS_DATASOURCE_USERNAME=... \
  -e PAYLENS_DATASOURCE_PASSWORD=... \
  paylens-backend:latest
```

**Prod profile features:**
- PostgreSQL (must be specified via env vars)
- Flyway migrations run automatically
- WARN logging only
- Large connection pool (20 max)
- SQL formatting disabled (performance)
- Strict mode: `ddl-auto: validate` (no schema mutations)

### Docker PostgreSQL Setup

The easiest way to run the application locally is with Docker Compose:

#### Prerequisites
```bash
# Install Docker & Docker Compose
brew install docker docker-compose

# Start Docker daemon (if not already running)
# On macOS with Docker Desktop, it runs automatically
```

#### Quick Start
```bash
# 1. Start PostgreSQL container
cd /Users/dbzpxuw/Documents/personal/payLens-project/payLens-BE
docker-compose up -d

# 2. Verify container is running
docker-compose ps
# Should show: paylens-postgres | postgres:17-alpine | Up (healthy)

# 3. Run application against Docker PostgreSQL
export SPRING_PROFILES_ACTIVE=dev
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
export PAYLENS_DATASOURCE_USERNAME=paylens
export PAYLENS_DATASOURCE_PASSWORD=paylens
export PAYLENS_EMPLOYEE_SEED_ENABLED=true
./gradlew bootRun

# 4. Application should start successfully
# Check logs: "Flyway migrations run" and "10,000 employees seeded"
```

#### Docker Compose Configuration

`docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:17-alpine       # Latest PostgreSQL stable
    container_name: paylens-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: paylens
      POSTGRES_USER: paylens
      POSTGRES_PASSWORD: paylens
    ports:
      - "5432:5432"                 # Expose to localhost
    volumes:
      - paylens_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U paylens -d paylens"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Key features:**
- Alpine Linux image (small, fast)
- Automatic restart on crash
- Data persists in named volume
- Health check monitors connectivity
- Port 5432 exposed to host machine

#### Common Docker Commands

```bash
# Start containers (detached)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Connect with psql
psql -h localhost -U paylens -d paylens

# Stop containers
docker-compose stop

# Stop and remove containers (keep data volume)
docker-compose down

# Stop and remove everything (including data)
docker-compose down -v
```

#### Verify PostgreSQL Setup

```bash
# Check container is running
docker-compose ps

# Check logs for "database system is ready to accept connections"
docker-compose logs postgres

# Connect to database
docker exec -it paylens-postgres psql -U paylens -d paylens

# Inside psql:
paylens=# SELECT COUNT(*) FROM employee;
paylens=# SELECT * FROM fx_rate;
paylens=# \q
```

### Environment Variable Reference

**Database Connection:**
```bash
PAYLENS_DATASOURCE_URL=jdbc:postgresql://host:5432/dbname
PAYLENS_DATASOURCE_USERNAME=username
PAYLENS_DATASOURCE_PASSWORD=password
```

**Spring Configuration:**
```bash
SPRING_PROFILES_ACTIVE=dev|test|prod
SPRING_APPLICATION_JSON='{"key":"value"}'  # Override via JSON
```

**Seeding:**
```bash
PAYLENS_EMPLOYEE_SEED_ENABLED=true|false   # Enable seed on startup
```

**Logging:**
```bash
LOGGING_LEVEL_ROOT=DEBUG|INFO|WARN|ERROR
LOGGING_LEVEL_COM_INCUBYTE_PAYLENS=DEBUG
```

### Configuration Precedence

Spring Boot loads configuration in this order (highest to lowest priority):

1. **Environment variables** (e.g., `PAYLENS_DATASOURCE_URL`)
2. **System properties** (e.g., `-Dspring.datasource.url=...`)
3. **application-{profile}.yaml** (e.g., `application-dev.yaml`)
4. **application.yaml** (default/fallback)

This allows environment variables to override all defaults, essential for Docker/production deployments.

### Development Workflow Example

**Scenario: You're developing a new employee API endpoint**

```bash
# 1. Start fresh PostgreSQL container
docker-compose down -v  # Clean previous state
docker-compose up -d

# 2. Set dev environment
export SPRING_PROFILES_ACTIVE=dev
export PAYLENS_DATASOURCE_URL=jdbc:postgresql://localhost:5432/paylens
export PAYLENS_DATASOURCE_USERNAME=paylens
export PAYLENS_DATASOURCE_PASSWORD=paylens
export PAYLENS_EMPLOYEE_SEED_ENABLED=true

# 3. Start application with 10,000 employees
./gradlew bootRun

# 4. Test your endpoint
curl http://localhost:8080/api/employees?page=0&pageSize=10

# 5. Run tests frequently
./gradlew test

# 6. Stop application (Ctrl+C)
# Postgres keeps running; data persists

# 7. Restart application (code is compiled)
./gradlew bootRun
```

**Scenario: Running tests**

```bash
# Tests automatically use the test profile (PostgreSQL via Testcontainers)
./gradlew test

# Run single test class
./gradlew test --tests EmployeeRepositoryTest

# Run tests with output
./gradlew test -i

# Clean test results
./gradlew cleanTest
```

**Scenario: Deploying to production**

```bash
# 1. Build JAR
./gradlew build

# 2. Run with production config
java -jar build/libs/paylens-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --spring.datasource.url=$PAYLENS_DATASOURCE_URL \
  --spring.datasource.username=$PAYLENS_DATASOURCE_USERNAME \
  --spring.datasource.password=$PAYLENS_DATASOURCE_PASSWORD
```

---

## Current Base Salary Update API

Endpoint:

```text
PATCH /api/employees/{id}/compensation
```

Request body:

```json
{
  "newSalary": 2800000,
  "currency": "INR",
  "reason": "PROMOTION"
}
```

Validation and behavior:

- `newSalary` is required and must be greater than `0`
- `currency` is required and must exist in the seeded `fx_rate` table
- `reason` is required and must be one of: `ANNUAL_REVIEW`, `PROMOTION`, `ROLE_CHANGE`, `MARKET_ADJUSTMENT`, `CORRECTION`, `OTHER`
- If employee is missing, API returns `404 NOT_FOUND`
- If concurrent modification is detected (optimistic lock), API returns `409 CONFLICT`

Success response:

```json
{
  "id": 1,
  "employeeNumber": "EMP-00001",
  "firstName": "Ava",
  "lastName": "Patel-1",
  "jobTitle": "Software Engineer",
  "department": "Engineering",
  "country": "India",
  "employmentStatus": "ACTIVE",
  "currentSalary": 2800000.00,
  "currency": "INR"
}
```

Notes:

- This updates only current base salary and current currency on `employee`
- No salary history or effective-dated compensation is stored in MVP
- No FX conversion is performed during this update operation

---

