# AGENTS.md

Guidance for AI coding agents working on the payLens backend. Read `README.md` first — it is the source of truth for scope and architecture.

## Project snapshot
- `payLens` is a Spring Boot backend for the Incubyte Salary Management Assessment.
- Single HR Manager persona, no auth. Base salary only. 10,000 deterministic employees.
- Architecture: **modular monolith** with strict layering per feature module: `Controller → Service → Repository → Domain`.
- Entry point: `src/main/java/com/incubyte/paylens/PayLensApplication.java` (`@SpringBootApplication`). Component scan root is `com.incubyte.paylens`.

## Stack (verified from `build.gradle`)
- Java 21 toolchain.
- Spring Boot `4.1.1`, dependency management `1.1.7`, Gradle wrapper.
- `spring-boot-starter-webmvc` (servlet MVC, not WebFlux).
- Lombok configured for main + test annotation processing.
- JUnit Platform via `tasks.named('test') { useJUnitPlatform() }`.

## Target module layout (under `com.incubyte.paylens`)
- `employee` — CRUD, list with server-side pagination/filter/sort, salary PATCH.
- `analytics` — DB-side aggregates: headcount, total, average, median; group-by country/department/role.
- `currency` — `FxRate` + `CurrencyConverter`, static/seeded rates, USD reporting normalization.
- `catalog` — `Country`, `Department`, `Role` reference tables.
- `common` — problem-response error model, pagination DTO, base exceptions.
- `config` — OpenAPI, Jackson, web config.
- `seed` — deterministic seed runner (10,000 employees, fixed RNG seed).

## Non-negotiable conventions
- Money is always `BigDecimal`; never `double`/`float`. FX to USD normalized in the backend.
- No effective-dated salary history — only current salary lives on `Employee`.
- Salary PATCH uses `@Version` optimistic locking; map `OptimisticLockingFailureException` to HTTP 409.
- Analytics aggregations run in the database (JPQL/native), not Java streams.
- Median: PostgreSQL `PERCENTILE_CONT` in prod, deterministic ordered window in H2 for tests.
- All list endpoints paginated (`Pageable`), max page size 200.
- Controllers return DTOs, never JPA entities.
- Services annotated `@Transactional` (write) or `@Transactional(readOnly = true)` (read). Controllers never open transactions.
- Validation via `jakarta.validation` on DTOs; central `@RestControllerAdvice` returns a consistent problem body.
- Flyway migrations under `src/main/resources/db/migration` are the only source of schema truth.

## Explicit non-goals
- No auth / SSO / RBAC.
- No salary history, bonuses, equity, allowances, CTC.
- No live FX API; rates are static/seeded.
- No microservices, no Kafka/Redis/external cache.
- No in-product AI/NLQ features.

If a change would introduce any of the above, stop and confirm.

## Verified workflows
```bash
./gradlew test
./gradlew build
./gradlew bootRun
```
- `./gradlew test` has been run successfully against this workspace.
- Local profiles once wired: `dev` (H2 file + seed on), `test` (in-memory H2), `prod` (PostgreSQL).

## Testing expectations
- JUnit 5 + Mockito for services and mappers.
- `@DataJpaTest` for repositories and analytics queries (including median).
- `@WebMvcTest` for controller contracts and error mapping.
- One thin `@SpringBootTest` happy-path integration test.
- Keep the total suite fast, deterministic, no shared mutable state.

## Reference files
- Build/dependencies: `build.gradle`
- Project name: `settings.gradle`
- App bootstrap: `src/main/java/com/incubyte/paylens/PayLensApplication.java`
- Runtime config: `src/main/resources/application.yaml`
- Product/architecture spec: `README.md`
- Assessment brief: `Salary Management Assessment- Candidates.txt`

## Current state vs target
- Repo today only contains `PayLensApplication` and a context-load test — no domain modules exist yet.
- The first PR should introduce the module skeleton (`employee`, `catalog`, `currency`, `analytics`, `common`, `config`, `seed`) plus Flyway `V1__init.sql`, before adding endpoints. Keep commits small and incremental.
