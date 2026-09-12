import { Component, input, effect, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsFilters, SalaryDistributionBucket } from '../../models/analytics.models';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

type WidgetState = 'loading' | 'loaded' | 'error' | 'empty';

@Component({
  selector: 'app-salary-distribution',
  imports: [LoadingStateComponent, ErrorStateComponent, BaseChartDirective],
  template: `
    <div class="widget-card">
      <div class="widget-header">
        <h2>Salary Distribution</h2>
      </div>
      
      <div class="widget-body">
        @switch (state()) {
          @case ('loading') {
            <div class="state-container">
              <app-loading-state message="Loading distribution..." />
            </div>
          }
          @case ('error') {
            <div class="state-container">
              <app-error-state 
                title="Chart Unavailable" 
                message="Failed to load distribution data."
                (retry)="loadData(filters())" 
              />
            </div>
          }
          @case ('empty') {
            <div class="state-container empty-state">
              <div class="icon">📈</div>
              <p>No distribution data for current filters.</p>
            </div>
          }
          @case ('loaded') {
            <div class="chart-container">
              <canvas baseChart
                [data]="chartData()"
                [options]="chartOptions"
                [type]="'bar'">
              </canvas>
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
      padding: 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .state-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 250px;
    }
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
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
  `]
})
export class SalaryDistributionComponent {
  filters = input.required<AnalyticsFilters>();
  
  private analyticsService = inject(AnalyticsService);
  
  state = signal<WidgetState>('loading');
  
  chartData = signal<ChartData<'bar'>>({ datasets: [], labels: [] });
  
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Employees: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Employees'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Salary Range'
        }
      }
    }
  };

  constructor() {
    effect(() => {
      this.loadData(this.filters());
    });
  }

  loadData(f: AnalyticsFilters) {
    this.state.set('loading');
    this.analyticsService.getDistribution(f).subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.state.set('empty');
        } else {
          this.chartData.set({
            labels: res.map(item => item.rangeLabel),
            datasets: [
              {
                data: res.map(item => item.employeeCount),
                backgroundColor: '#3b82f6',
                hoverBackgroundColor: '#2563eb',
                borderRadius: 4
              }
            ]
          });
          this.state.set('loaded');
        }
      },
      error: () => {
        this.state.set('error');
      }
    });
  }
}
