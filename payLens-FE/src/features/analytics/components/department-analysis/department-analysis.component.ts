import { Component, input, effect, inject, signal, untracked } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsFilters, DepartmentAnalytics } from '../../models/analytics.models';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';

type WidgetState = 'loading' | 'loaded' | 'error' | 'empty';

@Component({
  selector: 'app-department-analysis',
  imports: [CurrencyPipe, DecimalPipe, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="widget-card">
      <div class="widget-header">
        <h2>Department Comparison</h2>
      </div>
      
      <div class="widget-body">
        @switch (state()) {
          @case ('loading') {
            <div class="state-container">
              <app-loading-state message="Loading department data..." />
            </div>
          }
          @case ('error') {
            <div class="state-container">
              <app-error-state 
                title="Data Unavailable" 
                message="Failed to load department analytics."
                (retry)="loadData(filters())" 
              />
            </div>
          }
          @case ('empty') {
            <div class="state-container empty-state">
              <div class="icon">🏢</div>
              <p>No department data for current filters.</p>
            </div>
          }
          @case ('loaded') {
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th class="num">Employees</th>
                    <th class="num">Average Salary</th>
                    <th class="num">Median Salary</th>
                    <th class="num">Total Payroll</th>
                  </tr>
                </thead>
                <tbody>
                  @for (dept of data(); track dept.department) {
                    <tr>
                      <td class="font-medium">{{ dept.department }}</td>
                      <td class="num">{{ dept.employeeCount | number }}</td>
                      <td class="num">{{ dept.averageSalary | currency:dept.reportingCurrency:'symbol':'1.0-0' }}</td>
                      <td class="num">{{ dept.medianSalary | currency:dept.reportingCurrency:'symbol':'1.0-0' }}</td>
                      <td class="num font-medium">{{ dept.totalPayroll | currency:dept.reportingCurrency:'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin-bottom: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .widget-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .widget-header h2 {
      margin: 0;
      font-size: 16px;
      color: #0f172a;
    }
    .widget-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .state-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 250px;
      padding: 24px;
    }
    .empty-state {
      flex-direction: column;
      color: #64748b;
      gap: 8px;
    }
    .empty-state .icon {
      font-size: 24px;
      opacity: 0.5;
    }
    .empty-state p {
      margin: 0;
      font-size: 14px;
    }
    .table-container {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th, .data-table td {
      padding: 12px 24px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      color: #334155;
    }
    .data-table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .data-table .num {
      text-align: right;
    }
    .data-table .font-medium {
      font-weight: 500;
      color: #0f172a;
    }
  `]
})
export class DepartmentAnalysisComponent {
  filters = input.required<AnalyticsFilters>();
  
  private analyticsService = inject(AnalyticsService);
  
  state = signal<WidgetState>('loading');
  data = signal<DepartmentAnalytics[]>([]);

  constructor() {
    effect(() => {
      this.loadData(this.filters());
    });
  }

  loadData(f: AnalyticsFilters) {
    if (untracked(() => this.state()) !== 'loaded') {
      this.state.set('loading');
    }
    this.analyticsService.getByDepartment(f).subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.state.set('empty');
        } else {
          this.data.set(res);
          this.state.set('loaded');
        }
      },
      error: () => {
        this.state.set('error');
      }
    });
  }
}
