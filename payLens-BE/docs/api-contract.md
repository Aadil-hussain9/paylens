# API Contract — payLens Backend

This document is the **Angular-facing REST contract** for the approved backend. It describes only the endpoints that are currently implemented.

- Base URL when running locally: `http://localhost:8080`
- Base API path: `/api`
- Content type: `application/json`
- Monetary values are JSON numbers backed by Java `BigDecimal`
- Employee salaries are stored in the employee's **native currency**
- Analytics normalize salaries to **USD** using seeded FX rates in `fx_rate`
- Authentication/authorization are intentionally out of scope for this MVP; the API assumes an already-authorized HR Manager persona

## Common Conventions

### Error response (`ApiError`)

All non-2xx responses use the same structure:

```json
{
  "timestamp": "2026-09-06T18:25:43.511942+05:30",
  "status": 400,
  "error": "Bad Request",
  "code": "INVALID_REQUEST",
  "message": "Validation failed",
  "details": [
    "currency: currency is required",
    "newSalary: newSalary must be greater than zero"
  ]
}
```

Common status codes:

- `200 OK`
- `400 BAD_REQUEST`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `500 INTERNAL_SERVER_ERROR`

### Pagination response (`PageResponse<T>`)

Employee list responses use:

```json
{
  "content": [],
  "page": 0,
  "pageSize": 25,
  "totalElements": 10000,
  "totalPages": 400
}
```

### Filter terminology

The backend supports both:

- `role`
- `jobTitle`

They are **aliases of the same filter**.

If both are provided, they must match; otherwise the API returns `400 BAD_REQUEST`.

---

# 1. Employees

## 1.1 List employees

**Purpose**

Returns a paginated employee list for table/grid views.

**HTTP method / path**

```text
GET /api/employees
```

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---:|---|
| `page` | integer | No | Default `0`; must be `>= 0` |
| `pageSize` | integer | No | Default `25`; must be `> 0` and `<= 200` |
| `search` | string | No | Case-insensitive match across employee search fields |
| `country` | string | No | Exact match, case-insensitive |
| `department` | string | No | Exact match, case-insensitive |
| `role` | string | No | Alias of `jobTitle` |
| `jobTitle` | string | No | Alias of `role` |
| `employmentStatus` | enum | No | `ACTIVE`, `ON_LEAVE`, `TERMINATED` |
| `sortBy` | string | No | Default `employeeNumber`; supported: `employeeNumber`, `firstName`, `lastName`, `department`, `country`, `jobTitle`, `currentSalary` |
| `sortDirection` | enum | No | `ASC` or `DESC`, default `ASC` |

**Response DTO**

`PageResponse<EmployeeSummaryResponse>`

```json
{
  "content": [
    {
      "id": 2,
      "employeeNumber": "EMP-00002",
      "firstName": "Riya",
      "lastName": "Sharma",
      "jobTitle": "Software Engineer",
      "department": "Engineering",
      "country": "India",
      "employmentStatus": "ACTIVE"
    }
  ],
  "page": 0,
  "pageSize": 10,
  "totalElements": 1,
  "totalPages": 1
}
```

**Example request**

```http
GET /api/employees?page=0&pageSize=10&search=riya&country=India&department=Engineering&role=Software%20Engineer&employmentStatus=ACTIVE&sortBy=employeeNumber&sortDirection=ASC
```

**Validation / error cases**

- `400` if `page < 0`
- `400` if `pageSize <= 0` or `pageSize > 200`
- `400` if `sortBy` is unsupported
- `400` if `sortDirection` is not `ASC` or `DESC`
- `400` if both `role` and `jobTitle` are provided with different values

**Representative 400 response**

```json
{
  "timestamp": "2026-09-06T18:33:25.140336+05:30",
  "status": 400,
  "error": "Bad Request",
  "code": "INVALID_REQUEST",
  "message": "Unsupported sort field 'salaryHistory'. Allowed fields: [department, country, employeeNumber, firstName, currentSalary, lastName, jobTitle]",
  "details": [
    "Unsupported sort field 'salaryHistory'. Allowed fields: [department, country, employeeNumber, firstName, currentSalary, lastName, jobTitle]"
  ]
}
```

---

## 1.2 Get employee details

**Purpose**

Returns the fields required for an employee details/edit screen.

**HTTP method / path**

```text
GET /api/employees/{id}
```

**Path parameters**

| Name | Type | Required | Notes |
|---|---|---:|---|
| `id` | long | Yes | Must be `> 0` |

**Response DTO**

`EmployeeDetailsResponse`

```json
{
  "id": 3,
  "employeeNumber": "EMP-00003",
  "firstName": "John",
  "lastName": "Doe",
  "jobTitle": "Finance Analyst",
  "department": "Finance",
  "country": "Canada",
  "employmentStatus": "ON_LEAVE",
  "currentSalary": 90000.00,
  "currency": "CAD"
}
```

**Included fields**

- employee ID
- employee number
- first name
- last name
- job title
- department
- country
- employment status
- current salary
- currency

**Not included**

- no JPA/Hibernate metadata
- no database internals
- no salary history
- no display/full name field (Angular can compose it from first + last name)

**Example request**

```http
GET /api/employees/3
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` if `id <= 0`
- `404 NOT_FOUND` if the employee does not exist

**404 response**

```json
{
  "timestamp": "2026-09-06T18:34:42.501191+05:30",
  "status": 404,
  "error": "Not Found",
  "code": "EMPLOYEE_NOT_FOUND",
  "message": "Employee with id 999999 was not found",
  "details": [
    "Employee with id 999999 was not found"
  ]
}
```

---

# 2. Compensation

## 2.1 Update current compensation

**Purpose**

Updates the employee's **current** base salary and current currency in place.

**HTTP method / path**

```text
PATCH /api/employees/{id}/compensation
```

**Path parameters**

| Name | Type | Required | Notes |
|---|---|---:|---|
| `id` | long | Yes | Must be `> 0` |

**Request DTO**

`UpdateCompensationRequest`

```json
{
  "newSalary": 2800000,
  "currency": "INR",
  "reason": "PROMOTION"
}
```

**Request fields**

| Field | Type | Required | Notes |
|---|---|---:|---|
| `newSalary` | number | Yes | Must be greater than `0` |
| `currency` | string | Yes | 3-letter code; must exist in seeded `fx_rate` |
| `reason` | enum | Yes | `ANNUAL_REVIEW`, `PROMOTION`, `ROLE_CHANGE`, `MARKET_ADJUSTMENT`, `CORRECTION`, `OTHER` |

> `reason` is accepted as part of the HR update workflow but is **not persisted** because salary history / audit logging is intentionally out of scope for this MVP.

**Response DTO**

`EmployeeDetailsResponse`

```json
{
  "id": 1,
  "employeeNumber": "EMP-77777",
  "firstName": "Riya",
  "lastName": "Patel",
  "jobTitle": "Software Engineer",
  "department": "Engineering",
  "country": "India",
  "employmentStatus": "ACTIVE",
  "currentSalary": 2800000.00,
  "currency": "INR"
}
```

**Example request**

```http
PATCH /api/employees/1/compensation
Content-Type: application/json

{
  "newSalary": 2800000,
  "currency": "INR",
  "reason": "PROMOTION"
}
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` for validation failures or unsupported currency
- `404 NOT_FOUND` if employee does not exist
- `409 CONFLICT` if optimistic locking detects a concurrent update

**Representative validation error**

```json
{
  "timestamp": "2026-09-06T18:36:11.229128+05:30",
  "status": 400,
  "error": "Bad Request",
  "code": "INVALID_REQUEST",
  "message": "Validation failed",
  "details": [
    "currency: currency is required",
    "newSalary: newSalary must be greater than zero",
    "reason: reason is required"
  ]
}
```

**Representative unsupported currency error**

```json
{
  "timestamp": "2026-09-06T18:36:47.846188+05:30",
  "status": 400,
  "error": "Bad Request",
  "code": "INVALID_REQUEST",
  "message": "Unsupported currency 'XYZ'",
  "details": [
    "Unsupported currency 'XYZ'"
  ]
}
```

**Representative optimistic lock error**

```json
{
  "timestamp": "2026-09-06T18:37:19.086228+05:30",
  "status": 409,
  "error": "Conflict",
  "code": "CONCURRENT_MODIFICATION",
  "message": "The employee was updated by another request. Please retry with the latest data.",
  "details": [
    "Concurrent update detected"
  ]
}
```

---

# 3. Analytics

All analytics endpoints:

- run filtering in PostgreSQL
- run aggregation/grouping in PostgreSQL
- normalize native salaries to **USD** in PostgreSQL
- do **not** load all employees and aggregate in Angular or Java streams

Supported filters are consistent across all analytics endpoints:

| Name | Type | Required | Notes |
|---|---|---:|---|
| `country` | string | No | Case-insensitive exact match |
| `department` | string | No | Case-insensitive exact match |
| `role` | string | No | Alias of `jobTitle` |
| `jobTitle` | string | No | Alias of `role` |

If both `role` and `jobTitle` are supplied, they must match.

---

## 3.1 Summary

**Purpose**

Top-level payroll KPIs for dashboard cards.

**HTTP method / path**

```text
GET /api/analytics/summary
```

**Response DTO**

`AnalyticsSummaryResponse`

```json
{
  "totalEmployees": 3,
  "totalPayroll": 5204.82,
  "averageSalary": 1734.94,
  "medianSalary": 1204.82,
  "reportingCurrency": "USD"
}
```

**Example requests**

```http
GET /api/analytics/summary
GET /api/analytics/summary?country=India&department=Engineering
GET /api/analytics/summary?role=Senior%20Software%20Engineer
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` for invalid filter combinations (for example mismatched `role` and `jobTitle`)

**Empty result behavior**

Returns zeros, not `404`:

```json
{
  "totalEmployees": 0,
  "totalPayroll": 0.00,
  "averageSalary": 0.00,
  "medianSalary": 0.00,
  "reportingCurrency": "USD"
}
```

---

## 3.2 Salary distribution

**Purpose**

Returns fixed USD-normalized salary buckets for charting.

**HTTP method / path**

```text
GET /api/analytics/salary-distribution
```

**Response DTO**

`List<SalaryDistributionResponse>`

```json
[
  { "range": "0-50K", "employeeCount": 1250 },
  { "range": "50K-100K", "employeeCount": 3200 },
  { "range": "100K-150K", "employeeCount": 2700 },
  { "range": "150K-200K", "employeeCount": 1800 },
  { "range": "200K+", "employeeCount": 1050 }
]
```

**Buckets**

- `0-50K`
- `50K-100K`
- `100K-150K`
- `150K-200K`
- `200K+`

**Example request**

```http
GET /api/analytics/salary-distribution?country=India&department=Engineering
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` for invalid filters

**Empty result behavior**

Returns all buckets with zero counts where applicable.

---

## 3.3 Group by country

**Purpose**

Grouped dashboard/reporting view by employee country.

**HTTP method / path**

```text
GET /api/analytics/by-country
```

**Response DTO**

`List<CountryAnalyticsResponse>`

```json
[
  {
    "country": "Canada",
    "employeeCount": 1,
    "totalPayroll": 3000.00,
    "averageSalary": 3000.00,
    "medianSalary": 3000.00,
    "reportingCurrency": "USD"
  },
  {
    "country": "India",
    "employeeCount": 2,
    "totalPayroll": 2204.82,
    "averageSalary": 1102.41,
    "medianSalary": 1102.41,
    "reportingCurrency": "USD"
  }
]
```

**Example request**

```http
GET /api/analytics/by-country?department=Engineering&role=Senior%20Software%20Engineer
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` for invalid filters

---

## 3.4 Group by department

**Purpose**

Grouped dashboard/reporting view by department.

**HTTP method / path**

```text
GET /api/analytics/by-department
```

**Response DTO**

`List<DepartmentAnalyticsResponse>`

```json
[
  {
    "department": "Sales",
    "employeeCount": 1,
    "totalPayroll": 3000.00,
    "averageSalary": 3000.00,
    "medianSalary": 3000.00,
    "reportingCurrency": "USD"
  }
]
```

**Example request**

```http
GET /api/analytics/by-department?country=India
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` for invalid filters

---

## 3.5 Group by role

**Purpose**

Grouped dashboard/reporting view by job title / role.

**HTTP method / path**

```text
GET /api/analytics/by-role
```

**Response DTO**

`List<RoleAnalyticsResponse>`

> The response field name is **`jobTitle`** because that is the existing DTO contract.

```json
[
  {
    "jobTitle": "Sales Manager",
    "employeeCount": 1,
    "totalPayroll": 3000.00,
    "averageSalary": 3000.00,
    "medianSalary": 3000.00,
    "reportingCurrency": "USD"
  }
]
```

**Example requests**

```http
GET /api/analytics/by-role
GET /api/analytics/by-role?jobTitle=Software%20Engineer
GET /api/analytics/by-role?role=Software%20Engineer
```

**Status codes**

- `200 OK`
- `400 BAD_REQUEST` for invalid filters

**Empty result behavior**

Returns `[]`, not `404`.

---

# 4. CORS

The backend enables CORS only for `/api/**` and only for a configured origin.

Current property:

```text
paylens.web.cors.allowed-origin
```

Default:

```text
http://localhost:4200
```

This is intended for the Angular development server.

---

# 5. OpenAPI status

This backend **does not currently expose Swagger/OpenAPI**.

The supported source of truth for frontend integration is:

- this document: `docs/api-contract.md`
- architecture decisions: `docs/architecture-decisions.md`

---

# 6. Integration notes for Angular

The Angular app can consume the backend through service classes such as:

- `EmployeeApiService`
- `CompensationApiService`
- `AnalyticsApiService`

The client does **not** need to understand:

- JPA / Hibernate
- PostgreSQL / SQL
- FX conversion rules
- salary validation rules beyond displaying API errors
- analytics calculation formulas

Those remain backend concerns.


