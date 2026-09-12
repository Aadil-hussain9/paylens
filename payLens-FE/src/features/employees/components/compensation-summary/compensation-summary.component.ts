import { Component, input } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { CompensationSummary } from '../../models/compensation.model';

@Component({
  selector: 'app-compensation-summary',
  imports: [CurrencyPipe, PercentPipe],
  template: `
    <div class="summary-card">
      <div class="summary-header">
        <h2>Compensation Overview</h2>
      </div>
      
      <div class="summary-body">
        <div class="primary-stat">
          <label>Current Salary</label>
          <div class="val-primary">
            {{ summary().currentSalary | currency:summary().currency:'symbol':'1.0-0' }}
          </div>
        </div>
        
        <div class="secondary-stats">
          <div class="stat-group">
            <label>Dept Average</label>
            <div class="val">
              @if (summary().departmentAverage !== null) {
                {{ summary().departmentAverage | currency:summary().currency:'symbol':'1.0-0' }}
              } @else {
                <span class="placeholder">N/A</span>
              }
            </div>
            @if (summary().departmentAverage) {
              <div class="comparison" [class.positive]="getDeptDiff() > 0" [class.negative]="getDeptDiff() < 0">
                {{ getDeptDiff() > 0 ? '+' : '' }}{{ getDeptDiff() | percent:'1.1-1' }} vs avg
              </div>
            }
          </div>
          
          <div class="stat-group">
            <label>Company Average</label>
            <div class="val">
              @if (summary().companyAverage !== null) {
                {{ summary().companyAverage | currency:summary().currency:'symbol':'1.0-0' }}
              } @else {
                <span class="placeholder">N/A</span>
              }
            </div>
            @if (summary().companyAverage) {
              <div class="comparison" [class.positive]="getCompDiff() > 0" [class.negative]="getCompDiff() < 0">
                {{ getCompDiff() > 0 ? '+' : '' }}{{ getCompDiff() | percent:'1.1-1' }} vs avg
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      height: 100%;
    }
    .summary-header h2 {
      margin: 0 0 24px;
      font-size: 18px;
      color: #0f172a;
    }
    .summary-body {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .primary-stat label {
      display: block;
      font-size: 14px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .val-primary {
      font-size: 36px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .secondary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid #f1f5f9;
    }
    .stat-group label {
      display: block;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .val {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .comparison {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
    }
    .comparison.positive {
      color: #16a34a;
    }
    .comparison.negative {
      color: #dc2626;
    }
    .placeholder {
      color: #94a3b8;
    }
  `]
})
export class CompensationSummaryComponent {
  summary = input.required<CompensationSummary>();

  getDeptDiff(): number {
    const sum = this.summary();
    if (!sum.departmentAverage) return 0;
    return (sum.currentSalary - sum.departmentAverage) / sum.departmentAverage;
  }

  getCompDiff(): number {
    const sum = this.summary();
    if (!sum.companyAverage) return 0;
    return (sum.currentSalary - sum.companyAverage) / sum.companyAverage;
  }
}
