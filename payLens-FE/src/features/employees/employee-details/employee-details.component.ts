import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../employee.service/employee.service';
import { EmployeeDetails } from '../models/employee.models';
import { EmployeeSummaryComponent } from './components/employee-summary.component';
import { CurrentSalaryComponent } from './components/current-salary.component';
import { UpdateSalaryComponent } from '../../compensation/update-salary/update-salary.component';

type PageState = 'loading' | 'loaded' | 'error' | 'not-found';

@Component({
  selector: 'app-employee-details',
  imports: [
    EmployeeSummaryComponent,
    CurrentSalaryComponent,
    UpdateSalaryComponent
  ],
  template: `
    <div class="page-container">
      
      @if (state() === 'loading') {
        <div class="state-container">
          <div class="spinner"></div>
          <p>Loading employee data...</p>
        </div>
      }

      @if (state() === 'error' || state() === 'not-found') {
        <div class="state-container error">
          <span class="error-icon">⚠️</span>
          <h2>{{ state() === 'not-found' ? 'Employee Not Found' : 'Unable to load data' }}</h2>
          <p>{{ errorMessage() }}</p>
          <button class="retry-btn" (click)="loadEmployee()">Try Again</button>
        </div>
      }

      @if (state() === 'loaded' && employee()) {
        <div class="content-header">
          <h1>Employee Profile</h1>
        </div>
        
        <div class="content-grid">
          <div class="main-column">
            <app-employee-summary [employee]="employee()!" />
            <app-current-salary 
              [salary]="employee()!.currentSalary" 
              [currency]="employee()!.currency"
              (editSalary)="isEditingSalary.set(true)"
            />
          </div>
        </div>

        @if (isEditingSalary()) {
          <app-update-salary 
            [employee]="employee()!"
            (cancel)="isEditingSalary.set(false)"
            (success)="onSalaryUpdated()"
          />
        }

        @if (showSuccessNotification()) {
          <div class="toast-notification">
            <span class="icon">✅</span> Salary updated successfully.
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1000px;
      margin: 0 auto;
      padding-top: 16px;
    }
    .content-header {
      margin-bottom: 24px;
    }
    .content-header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      color: #64748b;
    }
    .state-container.error {
      color: #94a3b8;
    }
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .state-container h2 { margin: 0 0 8px; color: #1e293b; font-size: 20px; }
    .retry-btn {
      margin-top: 16px;
      padding: 8px 16px;
      background: #eff6ff;
      color: #2563eb;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .toast-notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
      z-index: 2000;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class EmployeeDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  state = signal<PageState>('loading');
  employee = signal<EmployeeDetails | null>(null);
  errorMessage = signal<string>('');
  
  isEditingSalary = signal<boolean>(false);
  showSuccessNotification = signal<boolean>(false);

  private employeeId: string | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.employeeId = params.get('id');
      this.loadEmployee();
    });
  }

  loadEmployee() {
    if (!this.employeeId) return;

    this.state.set('loading');
    this.employee.set(null);

    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (data) => {
        this.employee.set(data);
        this.state.set('loaded');
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Could not connect to the server.');
        this.state.set(err.message === 'Employee not found' ? 'not-found' : 'error');
      }
    });
  }

  onSalaryUpdated() {
    this.isEditingSalary.set(false);
    
    // We rely on the backend as the source of truth, so we MUST reload the employee record
    this.loadEmployee();

    // Show temporary success toast
    this.showSuccessNotification.set(true);
    setTimeout(() => {
      this.showSuccessNotification.set(false);
    }, 4000);
  }
}
