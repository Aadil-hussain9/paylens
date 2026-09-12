export interface UpdateSalaryRequest {
  newSalary: number;
  currency: string;
  reason: 'Annual Review' | 'Promotion' | 'Role Change' | 'Market Adjustment' | 'Correction' | 'Other';
}
