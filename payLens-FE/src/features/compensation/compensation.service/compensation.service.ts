import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { UpdateSalaryRequest } from '../models/compensation.models';
import { EmployeeService } from '../../employees/employee.service/employee.service';

@Injectable({ providedIn: 'root' })
export class CompensationService {
  private readonly employeeService = inject(EmployeeService);

  updateSalary(id: string, request: UpdateSalaryRequest): Observable<void> {
    // Validate request matches backend expectations
    if (!request.newSalary || request.newSalary <= 0) {
      return throwError(() => new Error('Invalid salary amount')).pipe(delay(400));
    }
    
    if (!request.currency || !request.reason) {
      return throwError(() => new Error('Missing required fields')).pipe(delay(400));
    }

    // Simulate backend concurrency/data verification check
    return this.employeeService.updateEmployeeSalary(id, request.newSalary, request.currency, request.reason).pipe(
      switchMap(() => of(void 0))
    );
  }
}
