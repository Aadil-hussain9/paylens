import { DashboardData } from '../models/dashboard.model';

export const MOCK_DASHBOARD_DATA: DashboardData = {
  kpis: {
    totalEmployees: 10247,
    totalAnnualPayroll: 684200000,
    averageSalary: 66788,
    countries: 12,
  },
  salaryDistribution: [
    { label: '< $30K', min: 0, max: 30000, employeeCount: 842 },
    { label: '$30K–$50K', min: 30000, max: 50000, employeeCount: 2891 },
    { label: '$50K–$70K', min: 50000, max: 70000, employeeCount: 3104 },
    { label: '$70K–$90K', min: 70000, max: 90000, employeeCount: 1987 },
    { label: '$90K–$120K', min: 90000, max: 120000, employeeCount: 1023 },
    { label: '$120K+', min: 120000, max: Infinity, employeeCount: 400 },
  ],
  payrollByCountry: [
    { country: 'United States', countryCode: 'US', employeeCount: 4120, totalPayroll: 312400000 },
    { country: 'United Kingdom', countryCode: 'GB', employeeCount: 1820, totalPayroll: 98200000 },
    { country: 'Germany', countryCode: 'DE', employeeCount: 1450, totalPayroll: 87400000 },
    { country: 'India', countryCode: 'IN', employeeCount: 1340, totalPayroll: 28600000 },
    { country: 'Canada', countryCode: 'CA', employeeCount: 890, totalPayroll: 61200000 },
    { country: 'Australia', countryCode: 'AU', employeeCount: 627, totalPayroll: 48300000 },
  ],
  salaryByDepartment: [
    { department: 'Engineering', minSalary: 52000, avgSalary: 94000, maxSalary: 185000, employeeCount: 2840 },
    { department: 'Sales', minSalary: 38000, avgSalary: 72000, maxSalary: 145000, employeeCount: 1620 },
    { department: 'Marketing', minSalary: 42000, avgSalary: 68000, maxSalary: 120000, employeeCount: 540 },
    { department: 'Finance', minSalary: 48000, avgSalary: 85000, maxSalary: 165000, employeeCount: 410 },
    { department: 'Operations', minSalary: 35000, avgSalary: 58000, maxSalary: 95000, employeeCount: 1230 },
    { department: 'Human Resources', minSalary: 40000, avgSalary: 62000, maxSalary: 110000, employeeCount: 280 },
    { department: 'Customer Support', minSalary: 32000, avgSalary: 48000, maxSalary: 78000, employeeCount: 1670 },
    { department: 'Legal', minSalary: 65000, avgSalary: 112000, maxSalary: 210000, employeeCount: 95 },
  ],
  insights: [
    {
      id: 'outlier-001',
      title: '3 employees with salaries above $250K detected',
      description:
        'Engineering has 2 employees and Legal has 1 employee earning above $250K, which is 3.7x the company average. Review for data entry errors or verify against approved compensation bands.',
      severity: 'high',
      category: 'outlier',
    },
    {
      id: 'variation-001',
      title: 'Engineering salary range spans $133K',
      description:
        'Engineering shows a min-to-max salary spread of $52K to $185K (3.6x ratio), the widest variation across all departments. Consider reviewing role-level banding structure.',
      severity: 'medium',
      category: 'variation',
    },
    {
      id: 'variation-002',
      title: 'Legal department has highest average salary',
      description:
        'Legal averages $112K, 68% above the company average of $66.8K. This is expected for specialized roles but worth monitoring as the department scales.',
      severity: 'low',
      category: 'variation',
    },
    {
      id: 'geography-001',
      title: 'India average salary significantly below company average',
      description:
        'The India office averages $21.3K per employee compared to the $66.8K global average. This aligns with cost-of-living differentials but confirm parity bands are applied consistently.',
      severity: 'medium',
      category: 'geography',
    },
    {
      id: 'geography-002',
      title: 'US payroll accounts for 46% of total compensation',
      description:
        'The United States represents 4,120 of 10,247 employees and $312.4M of $684.2M total annual payroll. Monitor concentration risk as the organization grows.',
      severity: 'low',
      category: 'geography',
    },
  ],
};
