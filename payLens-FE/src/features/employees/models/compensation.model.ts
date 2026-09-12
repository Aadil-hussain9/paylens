export interface SalaryHistoryEntry {
  id: string;
  employeeId: string;
  effectiveDate: string; // ISO format string YYYY-MM-DD
  previousSalary: number | null;
  newSalary: number;
  currency: string;
  changePercentage: number | null;
  reason: string;
  changedBy: string;
}

export interface CompensationSummary {
  employeeId: string;
  currentSalary: number;
  currency: string;
  departmentAverage: number | null;
  companyAverage: number | null;
}

export interface UpdateSalaryRequest {
  employeeId: string;
  newSalary: number;
  currency: string;
  effectiveDate: string; // ISO string YYYY-MM-DD
  reason: string;
  comment?: string;
  currentSalaryBase: number; // Used for concurrency checks
}
