import { Component, inject, signal } from '@angular/core';
import { DashboardData } from '../models/dashboard.model';
import { DashboardService } from '../services/dashboard.service';
import { KpiCardsComponent } from '../components/kpi-cards/kpi-cards.component';
import { SalaryDistributionComponent } from '../components/salary-distribution/salary-distribution.component';
import { PayrollByCountryComponent } from '../components/payroll-by-country/payroll-by-country.component';
import { DepartmentSalaryComponent } from '../components/department-salary/department-salary.component';
import { CompensationInsightsComponent } from '../components/compensation-insights/compensation-insights.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

type LoadState = 'loading' | 'loaded' | 'error' | 'empty';

@Component({
  selector: 'app-dashboard',
  imports: [
    KpiCardsComponent,
    SalaryDistributionComponent,
    PayrollByCountryComponent,
    DepartmentSalaryComponent,
    CompensationInsightsComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="dashboard">
      <header class="dashboard__header">
        <h1 class="dashboard__title">Compensation Dashboard</h1>
        <p class="dashboard__question">How does our organization pay people?</p>
      </header>

      @switch (state()) {
        @case ('loading') {
          <app-loading-state message="Loading compensation data..." />
        }
        @case ('error') {
          <app-error-state
            title="Failed to load dashboard"
            message="We couldn't retrieve compensation data. Please try again."
            (retry)="loadData()"
          />
        }
        @case ('empty') {
          <app-empty-state
            title="No compensation data available"
            message="There is no salary or payroll data to display yet."
          />
        }
        @case ('loaded') {
          @if (data(); as d) {
            <app-kpi-cards [data]="d.kpis" />

            <div class="dashboard__grid">
              <app-salary-distribution [bands]="d.salaryDistribution" />
              <app-payroll-by-country [countries]="d.payrollByCountry" />
            </div>

            <app-department-salary [departments]="d.salaryByDepartment" />

            <app-compensation-insights [insights]="d.insights" />
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .dashboard {
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .dashboard__header {
        margin-bottom: 4px;
      }
      .dashboard__title {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }
      .dashboard__question {
        font-size: 15px;
        color: #64748b;
        margin: 0;
      }
      .dashboard__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      @media (max-width: 900px) {
        .dashboard__grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  state = signal<LoadState>('loading');
  data = signal<DashboardData | null>(null);

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.state.set('loading');
    this.dashboardService.getDashboardData().subscribe({
      next: (result: DashboardData) => {
        const isEmpty =
          result.kpis.totalEmployees === 0 &&
          result.salaryDistribution.length === 0 &&
          result.payrollByCountry.length === 0 &&
          result.salaryByDepartment.length === 0 &&
          result.insights.length === 0;
        if (isEmpty) {
          this.state.set('empty');
        } else {
          this.data.set(result);
          this.state.set('loaded');
        }
      },
      error: () => {
        this.state.set('error');
      },
    });
  }
}
