export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: Department;
  jobTitle: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate: string;
  managerId: number | null;
  location: string;
  avatarUrl: string | null;
}

export interface Department {
  id: number;
  name: string;
  costCenter: string;
}

export enum EmploymentType {
  FullTime = 'FULL_TIME',
  PartTime = 'PART_TIME',
  Contract = 'CONTRACT',
  Intern = 'INTERN',
}

export enum EmployeeStatus {
  Active = 'ACTIVE',
  OnLeave = 'ON_LEAVE',
  Terminated = 'TERMINATED',
}

export interface EmployeeSummary {
  totalEmployees: number;
  activeCount: number;
  onLeaveCount: number;
  newHiresThisMonth: number;
}
