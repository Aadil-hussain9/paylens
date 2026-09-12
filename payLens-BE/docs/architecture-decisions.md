# Architecture Decisions — payLens Backend

Lightweight ADR log for the Salary Management Assessment. Each entry is intentionally short: **Decision / Reason / Trade-off**. This file lives with the code; deeper prose belongs in the README.

---

## 1. Modular monolith instead of microservices

- **Decision:** A single Spring Boot process with feature-oriented packages (`employee`, `compensation` inside `employee`, `analytics`, `currency`, `common`).
- **Reason:** One HR-Manager persona, one relational store, ~10k rows. Microservices would add deployment and consistency cost without any product benefit at this size.
- **Trade-off:** Any future need to scale analytics independently would require a controlled extraction; not a concern for MVP.

## 2. Feature-oriented package structure

- **Decision:** Package by feature (`employee`, `analytics`, `currency`, `common`), then by layer (`domain`, `repository`, `service`, `web`).
- **Reason:** Boundaries follow the product mental model; cross-feature coupling is visible and rare.
- **Trade-off:** Two services (`EmployeeService`, `CompensationService`) live in the same package because they share the `Employee` aggregate. Cosmetic re-packaging into a separate `compensation` module was considered and rejected.

## 3. PostgreSQL as the only datastore

- **Decision:** PostgreSQL for both OLTP and analytics.
- **Reason:** Assessment fixes PostgreSQL. It also handles the analytics load (`PERCENTILE_CONT`, aggregations, grouping) trivially at 10k rows.
- **Trade-off:** No dedicated OLAP store — not needed at this scale.

## 4. Flyway for schema management

- **Decision:** All schema evolution goes through Flyway migrations under `db/migration` (`V1`…`V4`).
- **Reason:** Deterministic, reviewable, and identical between dev/test/prod. `spring.jpa.hibernate.ddl-auto=validate` guarantees JPA mappings match the migrated schema.
- **Trade-off:** Contributors must write SQL migrations rather than rely on Hibernate DDL generation.

## 5. `BigDecimal` / `DECIMAL(19,2)` for money

- **Decision:** All monetary values are `BigDecimal` in Java and `DECIMAL(19,2)` in PostgreSQL, with `HALF_UP` rounding.
- **Reason:** Floating point is never acceptable for payroll.
- **Trade-off:** Slightly more verbose arithmetic; no meaningful downside.

## 6. Employee salary stored in native currency

- **Decision:** `employee.current_salary` and `employee.currency` store the salary as paid to the employee. USD is only used at the analytics reporting boundary.
- **Reason:** Preserves the source of truth; avoids destructive lossy conversions on write; matches how real HR systems record compensation.
- **Trade-off:** Every analytics query must join `fx_rate` for USD normalization. Cheap in Postgres.

## 7. Static, seeded FX rates

- **Decision:** The 8 supported FX rates are inserted by Flyway (`V2__create_fx_rate_table.sql`) and never updated at runtime.
- **Reason:** Deterministic analytics results, deterministic tests, no external dependency, no rates-refresh subsystem.
- **Trade-off:** A production build would need effective-dated FX and a rates provider. Explicitly out of scope.

## 8. Database-side analytics

- **Decision:** All aggregations, filters, grouping, distribution buckets, and currency normalization run inside PostgreSQL. Java only receives projections/DTOs.
- **Reason:** Correctness (Postgres handles large-arithmetic and null semantics), speed, and no risk of loading 10k entities into memory.
- **Trade-off:** Native SQL is harder to unit-test than a Java stream pipeline; we compensate with a dedicated `@SpringBootTest`-level `AnalyticsQueryRepositoryTest` running against real Postgres via Testcontainers.

## 9. `PERCENTILE_CONT(0.5)` for median

- **Decision:** Use PostgreSQL's continuous percentile aggregate for median salary.
- **Reason:** Native, indexable-friendly, correct on even and odd sample sizes; no Java-side sort-and-pick.
- **Trade-off:** Ties us to a Postgres-shaped analytics layer. Acceptable — the assessment fixes Postgres.

## 10. Optimistic locking on salary updates

- **Decision:** `@Version` on `Employee` (`V3__add_employee_version_column.sql`); `ObjectOptimisticLockingFailureException` maps to HTTP 409 in `GlobalExceptionHandler`.
- **Reason:** Two concurrent HR sessions should never silently overwrite each other's salary changes.
- **Trade-off:** Callers must handle 409 (retry with fresh data). Documented in the README.

## 11. Current salary only — no salary history

- **Decision:** `Employee` stores only the *current* base salary. There is no `salary_history` table.
- **Reason:** Assessment explicitly excludes history, effective-dated revisions, and audit logging. Storing history would leak into schema, API, tests, and analytics without product justification.
- **Trade-off:** `UpdateCompensationRequest.reason` is accepted but not persisted. Documented on the DTO Javadoc. Adding an audit table later is a purely additive change.

## 12. Authentication / RBAC out of scope

- **Decision:** No authentication, authorisation, SSO, JWT, or permission layer in the backend.
- **Reason:** The assessment explicitly assumes an already-authorised HR Manager persona and defers auth to a production hardening phase.
- **Trade-off:** The API is not deployable to a public network as-is. Adding Spring Security in front of the existing controllers is a bolt-on change: no controller/service/DTO change required.

## 13. AI is a development tool, not a product feature

- **Decision:** GitHub Copilot / LLM assistance is used for developing the codebase. The product itself contains no NLQ, embeddings, model gateway, or vector store.
- **Reason:** In-product AI querying is explicitly optional in the assessment. Introducing it would add unrelated infrastructure (model API keys, prompt safety, latency SLOs) without measurable HR value at this stage.
- **Trade-off:** A future "Ask" feature would need a small integration layer over the existing analytics APIs.

## 14. Testcontainers for repository / integration tests

- **Decision:** Tests use a Testcontainers-managed PostgreSQL 17 container (`jdbc:tc:postgresql:17-alpine:///paylens`). Flyway migrations run against the container, and JPA is set to `ddl-auto=validate`.
- **Reason:** Guarantees that repository and analytics tests validate the *actual* production schema. Removes the earlier schema-drift risk of `create-drop` + Flyway-disabled.
- **Trade-off:** First test in a run pays container-start cost (~5s). Container is reused across contexts; developers do not need to run Postgres manually.

## 15. Referential integrity for `employee.currency`

- **Decision:** `V4__add_employee_currency_fk.sql` adds a FK from `employee.currency` to `fx_rate.currency`.
- **Reason:** Belt-and-braces against inserting an employee with a currency that has no FX rate — which would break analytics silently.
- **Trade-off:** Adding a new supported currency now requires an FX-rate row before any employee can be written. This matches the invariant we already enforce in `CompensationService`.

