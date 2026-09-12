import { Component, input, effect, inject, signal, untracked } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsFilters, CompensationSummaryData } from '../../models/analytics.models';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';

type WidgetState = 'loading' | 'loaded' | 'error' | 'empty';

@Component({
  selector: 'app-compensation-summary',
  imports: [CurrencyPipe, DecimalPipe, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="widget-card">
      @switch (state()) {
        @case ('loading') {
          <div class="state-container">
            <app-loading-state message="Loading summary..." />
          </div>
        }
        @case ('error') {
          <div class="state-container">
            <app-error-state 
              title="Summary Unavailable" 
              message="Failed to load compensation KPIs."
              (retry)="loadData(filters())" 
            />
          </div>
        }
        @case ('empty') {
          <div class="state-container empty-state">
            <div class="icon">📊</div>
            <p>No employees match these filters.</p>
          </div>
        }
        @case ('loaded') {
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-label">Total Employees</span>
              <span class="kpi-value">{{ data()?.totalEmployees | number }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Total Payroll</span>
              <span class="kpi-value">{{ data()?.totalPayroll | currency:data()?.reportingCurrency:'symbol':'1.0-0' }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Average Salary</span>
              <span class="kpi-value">{{ data()?.averageSalary | currency:data()?.reportingCurrency:'symbol':'1.0-0' }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Median Salary</span>
              <span class="kpi-value">{{ data()?.medianSalary | currency:data()?.reportingCurrency:'symbol':'1.0-0' }}</span>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .widget-card {
      min-height: 120px;
      margin-bottom: 24px;
    }
    .state-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
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
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .kpi-label {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }
  `]
})
export class CompensationSummaryComponent {
  filters = input.required<AnalyticsFilters>();
  
  private analyticsService = inject(AnalyticsService);
  
  state = signal<WidgetState>('loading');
  data = signal<CompensationSummaryData | null>(null);

  constructor() {
    effect(() => {
      this.loadData(this.filters());
    });
  }

  loadData(f: AnalyticsFilters) {
    if (untracked(() => this.state()) !== 'loaded') {
      this.state.set('loading');
    }
    this.analyticsService.getSummary(f).subscribe({
      next: (res) => {
        if (res.totalEmployees === 0) {
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
