export interface KpiData {
  totalEmployees: number;
  totalAnnualPayroll: number;
  averageSalary: number;
  countries: number;
}

export interface SalaryBand {
  label: string;
  min: number;
  max: number;
  employeeCount: number;
}

export interface CountryPayroll {
  country: string;
  countryCode: string;
  employeeCount: number;
  totalPayroll: number;
}

export interface DepartmentSalary {
  department: string;
  minSalary: number;
  avgSalary: number;
  maxSalary: number;
  employeeCount: number;
}

export type InsightSeverity = 'high' | 'medium' | 'low';

export interface CompensationInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: 'outlier' | 'variation' | 'geography';
}

export interface DashboardData {
  kpis: KpiData;
  salaryDistribution: SalaryBand[];
  payrollByCountry: CountryPayroll[];
  salaryByDepartment: DepartmentSalary[];
  insights: CompensationInsight[];
}
