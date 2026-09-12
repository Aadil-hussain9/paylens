import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-current-salary',
  imports: [CurrencyPipe],
  template: `
    <div class="salary-card">
      <div class="salary-header">
        <h3 class="title">Current Base Salary</h3>
        <button class="edit-btn" (click)="editSalary.emit()">
          <span aria-hidden="true">✎</span> Edit Salary
        </button>
      </div>
      
      <div class="salary-content">
        <div class="salary-amount">
          <span class="amount">{{ salary() | currency:currency():'symbol':'1.0-0' }}</span>
          <span class="currency-code">{{ currency() }}</span>
        </div>
        <p class="salary-note">
          This represents the employee's current annualized base pay in their native currency. Organization-wide conversion is handled automatically in Analytics.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .salary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }
    .salary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .title {
      margin: 0;
      font-size: 18px;
      color: #1e293b;
      font-weight: 600;
    }
    .edit-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #2563eb;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .edit-btn:hover {
      background: #dbeafe;
    }
    .salary-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
    }
    .salary-amount {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .currency-code {
      font-size: 16px;
      font-weight: 600;
      color: #64748b;
    }
    .salary-note {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
  `]
})
export class CurrentSalaryComponent {
  salary = input.required<number>();
  currency = input.required<string>();
  
  editSalary = output<void>();
}
