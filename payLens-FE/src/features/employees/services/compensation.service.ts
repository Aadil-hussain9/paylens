import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { SalaryHistoryEntry, CompensationSummary, UpdateSalaryRequest } from '../models/compensation.model';
import { EmployeeService } from './employee.service';

@Injectable({ providedIn: 'root' })
export class CompensationService {
  private readonly mockDelay = 500;
  private readonly employeeService = inject(EmployeeService);
  
  // Local cache for mutable mock history
  private historyCache = new Map<string, SalaryHistoryEntry[]>();

  getCompensationSummary(employeeId: string): Observable<CompensationSummary> {
    return this.employeeService.getEmployeeById(employeeId).pipe(
      switchMap((employee) => {
        const summary: CompensationSummary = {
          employeeId: employee.id,
          currentSalary: employee.salary,
          currency: employee.currency,
          departmentAverage: employee.salary * 0.95,
          companyAverage: employee.salary * 0.9,
        };
        return of(summary).pipe(delay(this.mockDelay));
      })
    );
  }

  getSalaryHistory(employeeId: string): Observable<SalaryHistoryEntry[]> {
    return this.employeeService.getEmployeeById(employeeId).pipe(
      switchMap((employee) => {
        if (this.historyCache.has(employeeId)) {
          return of(this.historyCache.get(employeeId)!).pipe(delay(this.mockDelay));
        }

        const hash = employee.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        if (hash % 10 === 0) {
          this.historyCache.set(employeeId, []);
          return of([] as SalaryHistoryEntry[]).pipe(delay(this.mockDelay));
        }

        const history: SalaryHistoryEntry[] = [];
        let currentSalary = employee.salary;
        const currentYear = new Date().getFullYear();
        const recordsCount = (hash % 4) + 1;
        
        for (let i = 0; i < recordsCount; i++) {
          const year = currentYear - i;
          const decreaseFactor = 1 - ((hash % 8) + 3) / 100;
          const prevSalary = Math.round(currentSalary * decreaseFactor);
          
          history.push({
            id: `SH-${employeeId}-${year}`,
            employeeId,
            effectiveDate: `${year}-01-01`,
            previousSalary: prevSalary,
            newSalary: currentSalary,
            currency: employee.currency,
            changePercentage: Number(((currentSalary - prevSalary) / prevSalary * 100).toFixed(1)),
            reason: i === recordsCount - 1 ? 'Initial Hire' : (hash % 2 === 0 ? 'Annual Review' : 'Promotion'),
            changedBy: 'System'
          });
          currentSalary = prevSalary;
        }

        this.historyCache.set(employeeId, history);
        return of(history).pipe(delay(this.mockDelay));
      })
    );
  }

  updateSalary(request: UpdateSalaryRequest): Observable<void> {
    return this.employeeService.getEmployeeById(request.employeeId).pipe(
      switchMap((employee) => {
        // Concurrency check
        if (employee.salary !== request.currentSalaryBase) {
          return throwError(() => new Error('CONCURRENCY_CONFLICT'));
        }

        // Random mock failure for demonstration (about 5% chance)
        if (Math.random() < 0.05) {
          return throwError(() => new Error('NETWORK_ERROR'));
        }

        // Create new history entry
        const changePercentage = request.currentSalaryBase > 0 
          ? Number(((request.newSalary - request.currentSalaryBase) / request.currentSalaryBase * 100).toFixed(1))
          : 0;
          
        const newEntry: SalaryHistoryEntry = {
          id: `SH-${request.employeeId}-${Date.now()}`,
          employeeId: request.employeeId,
          effectiveDate: request.effectiveDate,
          previousSalary: request.currentSalaryBase,
          newSalary: request.newSalary,
          currency: request.currency,
          changePercentage,
          reason: request.reason,
          changedBy: 'HR Manager' // Mocked user
        };

        // Ensure history exists in cache
        if (!this.historyCache.has(request.employeeId)) {
           // Should ideally be populated by a previous get, but fallback just in case
           this.historyCache.set(request.employeeId, []); 
        }
        
        // Add to front of history
        const currentHistory = this.historyCache.get(request.employeeId)!;
        this.historyCache.set(request.employeeId, [newEntry, ...currentHistory]);

        // Update authoritative employee record
        this.employeeService._updateEmployeeSalary(request.employeeId, request.newSalary);

        return of(void 0).pipe(delay(this.mockDelay));
      })
    );
  }
}
