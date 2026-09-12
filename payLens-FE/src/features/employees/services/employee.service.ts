import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Employee, EmployeeQuery, PagedResponse } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(query: EmployeeQuery): Observable<PagedResponse<Employee>> {
    let params = new HttpParams()
      .set('page', (query.page - 1).toString()) // Backend might be 0-indexed, but let's check BE. BE is 0-indexed (default 0). FE is 1-indexed (default 1).
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.country) {
      params = params.set('country', query.country);
    }
    if (query.department) {
      params = params.set('department', query.department);
    }
    if (query.employmentStatus) {
      let backendStatus = query.employmentStatus;
      if (backendStatus === 'Active') backendStatus = 'ACTIVE';
      else if (backendStatus === 'On Leave') backendStatus = 'ON_LEAVE';
      else if (backendStatus === 'Terminated') backendStatus = 'TERMINATED';
      params = params.set('employmentStatus', backendStatus);
    }
    if (query.jobTitle) {
      params = params.set('jobTitle', query.jobTitle);
    }
    if (query.sortBy) {
      let backendSortBy: string = query.sortBy;
      if (query.sortBy === 'name') {
        backendSortBy = 'firstName';
      } else if (query.sortBy === 'salary') {
        backendSortBy = 'currentSalary';
      }
      params = params.set('sortBy', backendSortBy);
    }
    if (query.sortDirection) {
      params = params.set('sortDirection', query.sortDirection);
    }

    return this.http.get<PagedResponse<any>>(this.apiUrl, { params }).pipe(
      map(response => {
        response.content = response.content.map(emp => ({
          ...emp,
          name: `${emp.firstName} ${emp.lastName}`,
          salary: emp.currentSalary
        }));
        // Map backend 0-indexed page to frontend 1-indexed page
        response.page = response.page + 1;
        return response as PagedResponse<Employee>;
      })
    );
  }

  getEmployeeById(id: string): Observable<Employee> {
    // Note: the backend uses long for ID, but FE uses string (e.g. EMP-10001). 
    // Wait, let's check what ID the backend expects. If BE expects `long id`, we might need to extract the number.
    // I will extract just the numeric part if it starts with 'EMP-'.
    const numericId = id.startsWith('EMP-') ? id.replace('EMP-', '') : id;
    return this.http.get<Employee>(`${this.apiUrl}/${numericId}`);
  }

  updateEmployeeSalary(id: string, newSalary: number, currency: string, reason: string): Observable<Employee> {
    const numericId = id.startsWith('EMP-') ? id.replace('EMP-', '') : id;
    
    // Map frontend reason to backend enum if possible
    let backendReason = 'OTHER';
    if (reason === 'Annual Review') backendReason = 'ANNUAL_REVIEW';
    else if (reason === 'Promotion') backendReason = 'PROMOTION';
    else if (reason === 'Role Change') backendReason = 'ROLE_CHANGE';
    
    return this.http.patch<Employee>(`${this.apiUrl}/${numericId}/compensation`, {
      newSalary: newSalary,
      currency: currency,
      reason: backendReason
    });
  }
}
