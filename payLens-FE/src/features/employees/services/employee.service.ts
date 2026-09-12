import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Employee, EmployeeQuery, PagedResponse } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private employees: Employee[] = [];
  private readonly mockDelay = 400;

  constructor() {
    this.generateMockEmployees();
  }

  getEmployees(query: EmployeeQuery): Observable<PagedResponse<Employee>> {
    let filtered = this.employees.filter((emp) => {
      let matches = true;

      if (query.search) {
        const searchLower = query.search.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(searchLower);
        const matchesId = emp.id.toLowerCase().includes(searchLower);
        matches = matches && (matchesName || matchesId);
      }

      if (query.country) {
        matches = matches && emp.country === query.country;
      }

      if (query.department) {
        matches = matches && emp.department === query.department;
      }

      if (query.employmentStatus) {
        matches = matches && emp.employmentStatus === query.employmentStatus;
      }

      return matches;
    });

    if (query.sortBy && query.sortDirection) {
      filtered.sort((a, b) => {
        let valA: string | number = a[query.sortBy as keyof Employee];
        let valB: string | number = b[query.sortBy as keyof Employee];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return query.sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          return query.sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / query.pageSize);
    
    // Ensure requested page is within bounds
    const currentPage = query.page > totalPages && totalPages > 0 ? totalPages : query.page;
    
    const startIndex = (currentPage - 1) * query.pageSize;
    const endIndex = startIndex + query.pageSize;
    const content = filtered.slice(startIndex, endIndex);

    const response: PagedResponse<Employee> = {
      content,
      page: currentPage,
      pageSize: query.pageSize,
      totalElements,
      totalPages,
    };

    return of(response).pipe(delay(this.mockDelay));
  }

  getEmployeeById(id: string): Observable<Employee> {
    const employee = this.employees.find((emp) => emp.id === id);
    if (!employee) {
      return new Observable<Employee>((observer) => {
        setTimeout(() => {
          observer.error(new Error('Employee not found'));
        }, this.mockDelay);
      });
    }
    return of(employee).pipe(delay(this.mockDelay));
  }

  // Internal method to support mock compensation updates
  _updateEmployeeSalary(id: string, newSalary: number): void {
    const employee = this.employees.find((emp) => emp.id === id);
    if (employee) {
      employee.salary = newSalary;
    }
  }

  private generateMockEmployees(): void {
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'India', 'Canada', 'Australia'];
    const statuses: Array<'Active' | 'On Leave' | 'Terminated'> = ['Active', 'Active', 'Active', 'On Leave', 'Terminated'];
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    for (let i = 1; i <= 10000; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      let baseSalary = 50000;
      if (dept === 'Engineering') baseSalary += 40000;
      if (dept === 'Product') baseSalary += 30000;
      if (country === 'United States') baseSalary += 20000;
      if (country === 'India') baseSalary -= 30000;
      
      const salary = baseSalary + Math.floor(Math.random() * 20000);
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      this.employees.push({
        id: `EMP-${10000 + i}`,
        name: `${firstName} ${lastName}`,
        jobTitle: `${dept} Specialist`,
        department: dept,
        country: country,
        salary: salary,
        currency: country === 'United Kingdom' ? 'GBP' : country === 'Germany' ? 'EUR' : 'USD',
        employmentStatus: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
  }
}
