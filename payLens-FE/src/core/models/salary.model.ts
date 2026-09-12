import { EmploymentType, EmployeeStatus } from './employee.model';

export interface Salary {
  id: number;
  employeeId: number;
  baseAmount: number;
  bonusAmount: number;
  currency: string;
  payFrequency: PayFrequency;
  effectiveDate: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
}

export interface SalaryAdjustment {
  id: number;
  salaryId: number;
  employeeId: number;
  previousBaseAmount: number;
  newBaseAmount: number;
  adjustmentType: AdjustmentType;
  reason: string;
  effectiveDate: string;
  approvedBy: string;
}

export enum PayFrequency {
  Monthly = 'MONTHLY',
  SemiMonthly = 'SEMI_MONTHLY',
  BiWeekly = 'BIWEEKLY',
  Weekly = 'WEEKLY',
}

export enum AdjustmentType {
  Raise = 'RAISE',
  Promotion = 'PROMOTION',
  CostOfLiving = 'COST_OF_LIVING',
  MarketAdjustment = 'MARKET_ADJUSTMENT',
  Demotion = 'DEMOTION',
}

export interface CompensationSummary {
  averageSalary: number;
  medianSalary: number;
  totalPayroll: number;
  minSalary: number;
  maxSalary: number;
  averageBonus: number;
}
