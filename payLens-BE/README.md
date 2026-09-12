# payLens — Salary Management (Backend)

Employee salary management backend for the Incubyte "Salary Management Assessment". Built for a single HR Manager persona to manage base salaries of ~10,000 employees across countries and answer pay questions through structured analytics.

This document is the **source of truth for backend scope, architecture, and conventions**. UI is tracked separately.

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
- Relational DB via Spring Data JPA; profiles: `dev` (H2 file), `test` (H2 in-memory), `prod` (PostgreSQL-compatible).

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
- **Analytics performance:** aggregations (`SUM`, `AVG`, headcount, median) are computed in the database with JPQL/native queries. Median uses a DB-side percentile (`PERCENTILE_CONT`) on PostgreSQL, and a deterministic ordered-window fallback on H2 for tests.
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
- **Focused integration test (`@SpringBootTest`):** seed → list → analytics happy path on H2.
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
SPRING_PROFILES_ACTIVE=dev  ./gradlew bootRun    # H2 file DB + seed enabled
SPRING_PROFILES_ACTIVE=test ./gradlew test       # in-memory H2
```

Key endpoints when running locally:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- H2 console (dev only): `http://localhost:8080/h2-console`

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

