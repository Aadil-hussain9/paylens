export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  currency: string;
  employmentStatus: 'Active' | 'On Leave' | 'Terminated';
}

export interface EmployeeQuery {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  department?: string;
  employmentStatus?: string;
  sortBy?: 'name' | 'department' | 'country' | 'salary';
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
