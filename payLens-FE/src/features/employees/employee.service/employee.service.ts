import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { EmployeeDetails } from '../models/employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  
  // Mock database
  private mockEmployees: Record<string, EmployeeDetails> = {
    '1': {
      id: '1',
      employeeNumber: 'EMP-001',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      country: 'India',
      employmentStatus: 'Active',
      currentSalary: 2500000,
      currency: 'INR'
    },
    '2': {
      id: '2',
      employeeNumber: 'EMP-002',
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Product Manager',
      department: 'Product',
      country: 'United States',
      employmentStatus: 'Active',
      currentSalary: 140000,
      currency: 'USD'
    }
  };

  getEmployeeById(id: string): Observable<EmployeeDetails> {
    const employee = this.mockEmployees[id];
    
    if (!employee) {
      return throwError(() => new Error('Employee not found')).pipe(delay(500));
    }
    
    // Return a clone to prevent accidental local mutation bypassing the backend
    return of(JSON.parse(JSON.stringify(employee))).pipe(delay(800));
  }

  // Helper used by CompensationService to mock DB updates
  _updateEmployeeSalary(id: string, newSalary: number, currency: string): void {
    if (this.mockEmployees[id]) {
      this.mockEmployees[id].currentSalary = newSalary;
      this.mockEmployees[id].currency = currency;
    }
  }
}
