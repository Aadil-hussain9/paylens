import { Component, input, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsFilters, SalaryRangeAnalytics } from '../../models/analytics.models';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';

type WidgetState = 'loading' | 'loaded' | 'error' | 'empty';

@Component({
  selector: 'app-salary-range',
  imports: [CurrencyPipe, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="widget-card">
      <div class="widget-header">
        <h2>Salary Range Spread</h2>
      </div>
      
      <div class="widget-body">
        @switch (state()) {
          @case ('loading') {
            <div class="state-container">
              <app-loading-state message="Loading salary range..." />
            </div>
          }
          @case ('error') {
            <div class="state-container">
              <app-error-state 
                title="Data Unavailable" 
                message="Failed to load range data."
                (retry)="loadData(filters())" 
              />
            </div>
          }
          @case ('empty') {
            <div class="state-container empty-state">
              <div class="icon">📏</div>
              <p>No range data available.</p>
            </div>
          }
          @case ('loaded') {
            <div class="range-container">
              <div class="range-metric">
                <span class="label">Minimum</span>
                <span class="value">{{ data()?.min | currency:data()?.currency:'symbol':'1.0-0' }}</span>
              </div>
              <div class="range-metric">
                <span class="label">25th Percentile</span>
                <span class="value">{{ data()?.p25 | currency:data()?.currency:'symbol':'1.0-0' }}</span>
              </div>
              <div class="range-metric highlight">
                <span class="label">Median</span>
                <span class="value">{{ data()?.median | currency:data()?.currency:'symbol':'1.0-0' }}</span>
              </div>
              <div class="range-metric">
                <span class="label">75th Percentile</span>
                <span class="value">{{ data()?.p75 | currency:data()?.currency:'symbol':'1.0-0' }}</span>
              </div>
              <div class="range-metric">
                <span class="label">Maximum</span>
                <span class="value">{{ data()?.max | currency:data()?.currency:'symbol':'1.0-0' }}</span>
              </div>
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
    }
    .state-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
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
    .range-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .range-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .range-metric:last-child {
      border-bottom: none;
    }
    .range-metric.highlight {
      background: #f8fafc;
      padding: 12px 16px;
      margin: 0 -16px;
      border-radius: 6px;
      border-bottom: none;
    }
    .range-metric.highlight .label, .range-metric.highlight .value {
      color: #0f172a;
      font-weight: 600;
    }
    .label {
      font-size: 14px;
      color: #475569;
    }
    .value {
      font-size: 15px;
      font-weight: 500;
      color: #334155;
    }
  `]
})
export class SalaryRangeComponent {
  filters = input.required<AnalyticsFilters>();
  
  private analyticsService = inject(AnalyticsService);
  
  state = signal<WidgetState>('loading');
  data = signal<SalaryRangeAnalytics | null>(null);

  constructor() {
    effect(() => {
      this.loadData(this.filters());
    });
  }

  loadData(f: AnalyticsFilters) {
    this.state.set('loading');
    this.analyticsService.getSalaryRanges(f).subscribe({
      next: (res) => {
        if (!res || res.min === 0) {
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
