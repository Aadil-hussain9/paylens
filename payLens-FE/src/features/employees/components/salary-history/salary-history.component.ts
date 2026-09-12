import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { SalaryHistoryEntry } from '../../models/compensation.model';

@Component({
  selector: 'app-salary-history',
  imports: [CurrencyPipe, DatePipe, PercentPipe],
  template: `
    <div class="history-card">
      <div class="history-header">
        <h2>Salary History</h2>
      </div>
      
      @if (history().length === 0) {
        <div class="empty-history">
          <div class="empty-icon">📊</div>
          <h3>No history available</h3>
          <p>This employee does not have any recorded salary changes.</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="table" aria-label="Salary history table">
            <thead>
              <tr>
                <th scope="col">Effective Date</th>
                <th scope="col" class="th-right">Previous</th>
                <th scope="col" class="th-right">New Salary</th>
                <th scope="col" class="th-right">Change</th>
                <th scope="col">Reason</th>
                <th scope="col">Changed By</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of history(); track entry.id; let first = $first) {
                <tr [class.row-latest]="first">
                  <td class="td-date">
                    {{ entry.effectiveDate | date:'mediumDate' }}
                    @if (first) {
                      <span class="badge-current">Current</span>
                    }
                  </td>
                  <td class="td-right td-currency">
                    @if (entry.previousSalary !== null) {
                      {{ entry.previousSalary | currency:entry.currency:'symbol':'1.0-0' }}
                    } @else {
                      <span class="placeholder">-</span>
                    }
                  </td>
                  <td class="td-right td-currency td-new">
                    {{ entry.newSalary | currency:entry.currency:'symbol':'1.0-0' }}
                  </td>
                  <td class="td-right">
                    @if (entry.changePercentage !== null) {
                      <span class="change-badge" 
                            [class.positive]="entry.changePercentage > 0" 
                            [class.negative]="entry.changePercentage < 0">
                        {{ entry.changePercentage > 0 ? '+' : '' }}{{ entry.changePercentage / 100 | percent:'1.1-1' }}
                      </span>
                    } @else {
                      <span class="placeholder">-</span>
                    }
                  </td>
                  <td>{{ entry.reason }}</td>
                  <td class="td-secondary">{{ entry.changedBy }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .history-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .history-header {
      padding: 24px 24px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .history-header h2 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
    }
    .empty-history {
      padding: 48px 24px;
      text-align: center;
    }
    .empty-icon {
      font-size: 32px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .empty-history h3 {
      font-size: 16px;
      color: #1e293b;
      margin: 0 0 8px;
    }
    .empty-history p {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .table-container {
      overflow-x: auto;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      padding: 12px 24px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    td {
      padding: 16px 24px;
      font-size: 14px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .row-latest td {
      background-color: #f8fafc;
    }
    .th-right, .td-right {
      text-align: right;
    }
    .td-date {
      font-weight: 500;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge-current {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .td-currency {
      font-variant-numeric: tabular-nums;
    }
    .td-new {
      font-weight: 600;
      color: #0f172a;
    }
    .td-secondary {
      color: #64748b;
    }
    .change-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
    }
    .change-badge.positive {
      background: #dcfce7;
      color: #166534;
    }
    .change-badge.negative {
      background: #fee2e2;
      color: #991b1b;
    }
    .placeholder {
      color: #94a3b8;
    }
  `]
})
export class SalaryHistoryComponent {
  history = input.required<SalaryHistoryEntry[]>();
}
