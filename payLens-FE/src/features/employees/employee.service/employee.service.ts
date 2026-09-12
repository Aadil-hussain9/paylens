import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmployeeDetails } from '../models/employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployeeById(id: string | number): Observable<EmployeeDetails> {
    const idStr = String(id);
    const numericId = idStr.startsWith('EMP-') ? idStr.replace('EMP-', '') : idStr;
    return this.http.get<EmployeeDetails>(`${this.apiUrl}/${numericId}`);
  }

  updateEmployeeSalary(id: string | number, newSalary: number, currency: string, reason: string): Observable<EmployeeDetails> {
    const idStr = String(id);
    const numericId = idStr.startsWith('EMP-') ? idStr.replace('EMP-', '') : idStr;
    
    // Map frontend reason to backend enum if possible
    let backendReason = 'OTHER';
    if (reason === 'Annual Review') backendReason = 'ANNUAL_REVIEW';
    else if (reason === 'Promotion') backendReason = 'PROMOTION';
    else if (reason === 'Role Change') backendReason = 'ROLE_CHANGE';
    else if (reason === 'Market Adjustment') backendReason = 'MARKET_ADJUSTMENT';
    else if (reason === 'Correction') backendReason = 'CORRECTION';

    return this.http.patch<EmployeeDetails>(`${this.apiUrl}/${numericId}/compensation`, {
      newSalary: newSalary,
      currency: currency,
      reason: backendReason
    });
  }
}
