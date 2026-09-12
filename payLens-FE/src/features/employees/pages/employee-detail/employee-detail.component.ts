import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { CompensationService } from '../../services/compensation.service';
import { Employee } from '../../models/employee.model';
import { SalaryHistoryEntry, CompensationSummary } from '../../models/compensation.model';
import { EmployeeSummaryComponent } from '../../components/employee-summary/employee-summary.component';
import { CompensationSummaryComponent } from '../../components/compensation-summary/compensation-summary.component';
import { SalaryHistoryComponent } from '../../components/salary-history/salary-history.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { UpdateSalaryModalComponent } from '../../components/update-salary-modal/update-salary-modal.component';

type DetailState = 'loading' | 'loaded' | 'error' | 'not-found';

@Component({
  selector: 'app-employee-detail',
  imports: [
    RouterLink,
    EmployeeSummaryComponent,
    CompensationSummaryComponent,
    SalaryHistoryComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    UpdateSalaryModalComponent
  ],
  template: `
    <div class="page">
      <div class="breadcrumb">
        <a routerLink="/employees" class="back-link">← Back to Employees</a>
      </div>

      @switch (state()) {
        @case ('loading') {
          <app-loading-state message="Loading employee details..." />
        }
        @case ('not-found') {
          <app-empty-state
            title="Employee Not Found"
            message="The employee you are looking for does not exist or has been removed."
          >
            <a routerLink="/employees" class="btn-primary">Return to Directory</a>
          </app-empty-state>
        }
        @case ('error') {
          <app-error-state
            title="Failed to load details"
            message="We couldn't retrieve this employee's information. Please try again."
            (retry)="loadData()"
          />
        }
        @case ('loaded') {
          @if (employee() && compensationSummary() && salaryHistory()) {
            
            @if (successMessage()) {
              <div class="alert-success">
                {{ successMessage() }}
              </div>
            }

            <header class="page-header">
              <h1>Employee Details</h1>
              <div class="actions">
                <button class="btn-primary" (click)="isModalOpen.set(true)">Update Salary</button>
              </div>
            </header>
            
            <div class="content-grid">
              <div class="column-main">
                <app-employee-summary [employee]="employee()!" />
              </div>
              <div class="column-sidebar">
                <app-compensation-summary [summary]="compensationSummary()!" />
              </div>
            </div>
            
            <div class="section-history">
              <app-salary-history [history]="salaryHistory()!" />
            </div>

            @if (isModalOpen()) {
              <app-update-salary-modal 
                [employeeId]="employee()!.id"
                [currentSalary]="employee()!.salary"
                [currency]="employee()!.currency"
                (close)="isModalOpen.set(false)"
                (success)="onSalaryUpdated()"
              />
            }
          }
        }
      }
    </div>
  `,
  styles: [`
    .page {
      max-width: 1200px;
      margin: 0 auto;
    }
    .breadcrumb {
      margin-bottom: 24px;
    }
    .back-link {
      color: #64748b;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s;
    }
    .back-link:hover {
      color: #0f172a;
    }
    .alert-success {
      background: #dcfce7;
      border-left: 4px solid #22c55e;
      padding: 12px 16px;
      margin-bottom: 24px;
      color: #166534;
      font-size: 14px;
      border-radius: 4px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #0f172a;
    }
    .btn-primary {
      display: inline-block;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .section-history {
      margin-bottom: 48px;
    }
    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);
  private compensationService = inject(CompensationService);

  state = signal<DetailState>('loading');
  
  employee = signal<Employee | null>(null);
  compensationSummary = signal<CompensationSummary | null>(null);
  salaryHistory = signal<SalaryHistoryEntry[] | null>(null);

  isModalOpen = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadDataForId(id);
      } else {
        this.state.set('not-found');
      }
    });
  }

  loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDataForId(id);
    }
  }

  private loadDataForId(id: string, isRefresh = false): void {
    if (!isRefresh) {
      this.state.set('loading');
    }
    
    // Using switchMap on the employee call first so we can catch a 404 properly
    // before attempting to load compensation data.
    this.employeeService.getEmployeeById(id).pipe(
      switchMap(employee => {
        return forkJoin({
          emp: of(employee),
          summary: this.compensationService.getCompensationSummary(id),
          history: this.compensationService.getSalaryHistory(id)
        });
      }),
      catchError(err => {
        if (err.message === 'Employee not found') {
          this.state.set('not-found');
        } else {
          this.state.set('error');
        }
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.employee.set(result.emp);
        this.compensationSummary.set(result.summary);
        this.salaryHistory.set(result.history);
        this.state.set('loaded');
      }
    });
  }

  onSalaryUpdated() {
    this.isModalOpen.set(false);
    this.successMessage.set('Salary successfully updated.');
    
    // Refresh authoritative data from backend APIs
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDataForId(id, true);
    }

    // Clear success message after a few seconds
    setTimeout(() => {
      this.successMessage.set(null);
    }, 5000);
  }
}
