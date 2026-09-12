export interface AnalyticsFilters {
  country?: string;
  department?: string;
  role?: string;
  employmentStatus?: string;
}

export interface CompensationSummaryData {
  totalEmployees: number;
  totalPayroll: number;
  averageSalary: number;
  medianSalary: number;
  reportingCurrency: string;
}

export interface SalaryDistributionBucket {
  range: string;
  employeeCount: number;
}

export interface DepartmentAnalytics {
  department: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
  totalPayroll: number;
  reportingCurrency: string;
}

export interface CountryAnalytics {
  country: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number;
  totalPayroll: number;
  reportingCurrency: string;
}

export interface SalaryRangeAnalytics {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  currency: string;
}
