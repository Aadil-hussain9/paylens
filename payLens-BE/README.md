# payLens — Salary Management (Backend)

Employee salary management backend for the Incubyte "Salary Management Assessment". Built for a single HR Manager persona to manage base salaries of ~10,000 employees across countries and answer pay questions through structured analytics.

This document is the **source of truth for backend scope, architecture, and conventions**. UI is tracked separately.

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
- Base salary only, stored in the employee's **native local currency**.
- CRUD-lite management of employees and their **current** base salary (update in place).
- Server-side **list APIs** with pagination, filtering, and sorting for 10,000 employees.
- **Analytics** answering "how does the org pay people":
  - Total payroll spend (normalized to a reporting currency, USD).
  - Headcount.
  - **Average** and **median** salary.
  - Breakdowns / group-bys by **country**, **department**, and **role**.
- Deterministic **seed** of exactly 10,000 employees and a **static FX table**.
- Clean layered architecture, unit + slice tests, OpenAPI docs.

**Explicitly out of scope (deferred to future phases)**
- Bonuses, equity, allowances, CTC breakdowns.
- Effective-dated salary history / revision log (only current salary is stored).
- Live FX API integration — FX rates are static/seeded.
- Authentication, SSO, RBAC, audit logging, PII masking.
- Multi-tenant support.
- Natural-language / AI querying inside the product (AI is used in dev workflow only).
- Microservices, message brokers, caching layers, or any infra beyond a single relational DB.
- Frontend concerns (documented in the UI project).

**Trade-offs**
- Storing only the current salary keeps the schema simple and the analytics queries cheap; historical trending is intentionally deferred.
- Static FX rates make analytics deterministic and testable; production would require a rates service and effective-dated FX.
- Single HR manager persona removes AuthN/AuthZ complexity so the assessment focus stays on domain, performance, and testing.

---

## 2. Architecture

**Style:** Modular monolith, layered per feature.

```
Controller  →  Service  →  Repository  →  Domain (JPA entity)
    ▲              ▲              ▲
    │              │              │
   DTO         Domain model    Spring Data JPA
```

**Modules (packages under `com.incubyte.paylens`):**
- `employee` — employee CRUD, list/search, current-salary update.
- `analytics` — payroll KPIs and group-by breakdowns; all aggregations run in the database.
- `currency` — static FX rate table + a `CurrencyConverter` used by analytics to normalize to USD.
- `catalog` — reference data: countries, departments, roles (kept as first-class entities so filters and analytics are index-friendly).
- `common` — shared DTOs, error model, pagination helpers, base exceptions.
- `config` — Spring configuration (OpenAPI, Jackson, etc.).
- `seed` — one-shot deterministic data loader for 10,000 employees + FX rates.

**Runtime characteristics**
- Single Spring Boot process (`PayLensApplication`).
- Servlet stack (`spring-boot-starter-webmvc`).
- Relational DB via Spring Data JPA; profiles: `dev` (PostgreSQL on localhost/Docker), `test` (PostgreSQL on Docker Compose), `prod` (PostgreSQL with env-provided credentials), `docker` (PostgreSQL in Docker network).

---

## 3. Domain model

Minimal entities aligned to the confirmed scope:

- **Country** `{ id, isoCode (unique), name, currencyCode }`
- **Department** `{ id, code (unique), name }`
- **Role** `{ id, code (unique), title }`
- **Employee**
  - `id`, `employeeCode` (unique, deterministic)
  - `firstName`, `lastName`, `email` (unique)
  - `countryId`, `departmentId`, `roleId` (FKs)
  - `baseSalaryAmount` (`DECIMAL(15,2)`, non-null)
  - `baseSalaryCurrency` (`CHAR(3)`, ISO 4217, non-null; usually equals `Country.currencyCode`)
  - `hireDate`
  - `createdAt`, `updatedAt`, `version` (`@Version` for optimistic locking)
- **FxRate** `{ id, currencyCode (unique), rateToUsd (DECIMAL(18,8)), asOfDate }`

Notes:
- No `SalaryHistory` table. Salary updates mutate `Employee` in place.
- Money is `BigDecimal` end-to-end. No `double` for money.
- Country/Department/Role kept as tables (not enums) so analytics group-bys are FK-driven and indexable, and reference data is easy to seed.

---

## 4. Database schema & indexing

Indexes required for scale at 10k rows and realistic filter combos:
- `employee (country_id)`
- `employee (department_id)`
- `employee (role_id)`
- `employee (country_id, department_id)` composite (common analytics/filter combo)
- `employee (last_name, first_name)` for name search/sort
- Unique: `employee.email`, `employee.employee_code`, `country.iso_code`, `department.code`, `role.code`, `fx_rate.currency_code`.

Schema is managed by **Flyway** migrations under `src/main/resources/db/migration`.

---

## 5. REST API surface

Base path: `/api/v1`.

**Employees**
- `GET  /employees` — paginated, filterable, sortable list.
  - Query params: `page`, `size`, `sort` (Spring style, e.g. `sort=lastName,asc`), `countryId`, `departmentId`, `roleId`, `q` (matches name/email/employeeCode).
- `GET  /employees/{id}` — fetch one.
- `POST /employees` — create.
- `PUT  /employees/{id}` — update non-salary attributes.
- `PATCH /employees/{id}/salary` — update **current** base salary
  - Body: `{ "amount": "125000.00", "currency": "INR" }`
  - Uses `@Version` optimistic locking; returns `409` on stale update.
- `DELETE /employees/{id}` — delete.

**Analytics** (all totals normalized to USD via seeded FX)
- `GET /analytics/summary` — `{ headcount, totalPayrollUsd, averageSalaryUsd, medianSalaryUsd }`.
- `GET /analytics/by-country` — grouped rows: `{ countryId, isoCode, headcount, totalUsd, averageUsd, medianUsd }`.
- `GET /analytics/by-department` — same shape, grouped by department.
- `GET /analytics/by-role` — same shape, grouped by role.
- Optional filters mirror the employees list (`countryId`, `departmentId`, `roleId`).

**Reference data**
- `GET /countries`, `GET /departments`, `GET /roles` — small, un-paginated lists used by UI filters.

**Conventions**
- Requests/responses use DTOs (never expose entities).
- Errors return a consistent problem body: `{ timestamp, status, error, code, message, details[] }`.
- All list endpoints are paginated. Max `size` is 200.

---

## 6. Cross-cutting requirements

- **Validation:** `jakarta.validation` on DTOs (`@NotBlank`, `@Email`, `@NotNull`, `@Positive`, `@Size`), ISO codes validated with custom `@Iso4217` / `@IsoCountry` constraints where relevant.
- **Exception handling:** single `@RestControllerAdvice` maps domain exceptions (`NotFoundException`, `ConflictException`, `ValidationException`) and `OptimisticLockingFailureException` to the problem body.
- **Transactions:** service methods that write are `@Transactional`; reads are `@Transactional(readOnly = true)`. Controllers never open transactions.
- **Concurrency:** `@Version` on `Employee`. Salary PATCH translates JPA optimistic failure to HTTP 409.
- **Currency conversion:** `CurrencyConverter` looks up `FxRate.rateToUsd`; missing rate → `ConflictException`. Rounding: `HALF_UP` to 2 decimal places for reporting.
- **Analytics performance:** aggregations (`SUM`, `AVG`, headcount, median) are computed in the database with JPQL/native queries. Median uses PostgreSQL-native SQL patterns (for example `PERCENTILE_CONT`) to keep logic deterministic and DB-driven.
- **Pagination:** Spring `Pageable`; responses use `Page<T>` mapped to `{ content, page, size, totalElements, totalPages }`.

---

## 7. Seeding

- Component `SeedRunner` (activated by `paylens.seed.enabled=true`) inserts:
  - Reference data: ~15 countries, ~8 departments, ~12 roles.
  - Static FX rates keyed to USD.
  - Exactly **10,000 employees** using a **fixed random seed** for determinism.
- Salary bands are derived per (country, role) so analytics produce meaningful variance.
- Seeding is idempotent: it no-ops if `employee` count ≥ 10,000.

---

## 8. Testing strategy

- **Unit tests (JUnit 5 + Mockito):** services, converters, mappers, validators.
- **Repository slice tests (`@DataJpaTest`):** custom queries, index-touching filters, median.
- **Web slice tests (`@WebMvcTest`):** controller contract, validation errors, error mapping.
- **Focused integration test (`@SpringBootTest`):** seed → list → analytics happy path on PostgreSQL.
- Tests must be fast (< 30s total), deterministic, and independent (no shared mutable state).

---

## 9. Build, run, and workflows

Requires JDK 21. Uses the Gradle wrapper.

```bash
./gradlew test          # run all tests
./gradlew build         # compile + test + package
./gradlew bootRun       # start the app on :8080
```

Profiles:
```bash
SPRING_PROFILES_ACTIVE=dev    ./gradlew bootRun  # PostgreSQL (local/Docker)
SPRING_PROFILES_ACTIVE=test   ./gradlew test     # PostgreSQL via Docker Compose
SPRING_PROFILES_ACTIVE=prod   ./gradlew bootRun  # PostgreSQL (prod env vars required)
SPRING_PROFILES_ACTIVE=docker ./gradlew bootRun  # PostgreSQL in Docker network
```

Key endpoints when running locally:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- PostgreSQL inspection via `psql` or `docker-compose logs -f postgres`

---

## 10. Repository layout (target)

```
src/main/java/com/incubyte/paylens/
├── PayLensApplication.java
├── common/           # error model, pagination, base exceptions
├── config/           # OpenAPI, Jackson, web config
├── catalog/          # Country, Department, Role (entity + repo + controller)
├── currency/         # FxRate entity/repo + CurrencyConverter
├── employee/         # Employee entity, repo, service, controller, DTOs, mapper
├── analytics/        # Analytics service + controller + DB-side queries
└── seed/             # SeedRunner + deterministic data providers

src/main/resources/
├── application.yaml
├── application-dev.yaml
├── application-docker.yaml
├── application-prod.yaml
├── application-test.yaml
└── db/migration/     # Flyway V1__init.sql, V2__seed_reference.sql, ...
```

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
- **V2__create_fx_rate_table.sql** — FX rate table with seed data

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

Tests use **PostgreSQL from Docker Compose** (same engine as development):

**Configuration** (`src/test/resources/application.yaml`):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/paylens
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
```

**Benefits:**
- No external dependency on a running PostgreSQL instance
- No in-memory surrogate database
- Same PostgreSQL engine/config used in local runtime
- Real PostgreSQL dialect and constraint behavior

**FX rate seeding** (`FxRateTestSeedRunner`):
- Activated only in `test` profile
- Runs as CommandLineRunner on startup
- Inserts 8 FX rates (same as production)
- Idempotent: checks existing count before inserting

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
# Compile and test (uses PostgreSQL from Docker Compose)
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
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs
- **PostgreSQL logs**: `docker-compose logs -f postgres`

---

## Spring Profiles & Configuration

The application supports four Spring profiles: **dev**, **test**, **prod**, and **docker**. Each profile has its own configuration file optimized for its environment.

### Profile Overview

| Profile | Database | Use Case | Auto-seed | Logging | Pool Size |
|---------|----------|----------|-----------|---------|-----------|
| **dev** | PostgreSQL (localhost:5432) | Local development | false | DEBUG | 10 |
| **test** | PostgreSQL (Docker Compose) | Unit & integration tests | false | WARN | 10 |
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
- Smaller connection pool (5 max)
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
- PostgreSQL at `localhost:5432` (Docker Compose)
- `ddl-auto: create-drop` for isolated schema lifecycle per context
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
# Tests automatically use test profile (PostgreSQL Docker Compose)
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

