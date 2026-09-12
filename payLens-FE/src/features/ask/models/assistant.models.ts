export type AssistantIntent = 
  | 'AVERAGE_SALARY'
  | 'MEDIAN_SALARY'
  | 'TOTAL_PAYROLL'
  | 'EMPLOYEE_COUNT'
  | 'SALARY_DISTRIBUTION'
  | 'SALARY_BY_DEPARTMENT'
  | 'SALARY_BY_COUNTRY'
  | 'SALARY_OUTLIERS';

export interface AssistantQueryRequest {
  question: string;
}

export interface AssistantContext {
  employeesAnalyzed: number;
  department?: string;
  country?: string;
  metric: string;
  reportingCurrency: string;
  timestamp: string;
}

export interface AssistantResponse {
  answer: string;
  context?: AssistantContext;
  relatedAnalyticsLink?: string;
  status: 'success' | 'unsupported' | 'error';
  errorMessage?: string;
}
