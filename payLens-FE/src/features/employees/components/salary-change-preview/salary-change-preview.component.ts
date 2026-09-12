import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { SalaryUpdateFormValue } from '../salary-update-form/salary-update-form.component';

@Component({
  selector: 'app-salary-change-preview',
  imports: [CurrencyPipe, DatePipe, PercentPipe],
  template: `
    <div class="preview-container">
      <h3>Review Salary Change</h3>
      <p class="warning-text">Please review the details below carefully before confirming.</p>

      <div class="diff-card">
        <div class="diff-row">
          <span class="label">Current Salary</span>
          <span class="value">{{ currentSalary() | currency:currency():'symbol':'1.0-0' }}</span>
        </div>
        <div class="diff-row">
          <span class="label">New Salary</span>
          <span class="value new-value">{{ formValue().newSalary | currency:currency():'symbol':'1.0-0' }}</span>
        </div>
        <div class="diff-row highlight">
          <span class="label">Change</span>
          <span class="value change-value" 
                [class.positive]="getChangeAmount() > 0" 
                [class.negative]="getChangeAmount() < 0">
            {{ getChangeAmount() > 0 ? '+' : '' }}{{ getChangeAmount() | currency:currency():'symbol':'1.0-0' }} 
            ({{ getChangeAmount() > 0 ? '+' : '' }}{{ getChangePercentage() | percent:'1.1-1' }})
          </span>
        </div>
      </div>

      <div class="meta-card">
        <div class="meta-row">
          <span class="label">Effective Date</span>
          <span class="value">{{ formValue().effectiveDate | date:'mediumDate' }}</span>
        </div>
        <div class="meta-row">
          <span class="label">Reason</span>
          <span class="value">{{ formValue().reason }}</span>
        </div>
        @if (formValue().comment) {
          <div class="meta-row">
            <span class="label">Comment</span>
            <span class="value italic">"{{ formValue().comment }}"</span>
          </div>
        }
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" (click)="back.emit()" [disabled]="submitting()">Back to Edit</button>
        <button type="button" class="btn-primary" (click)="confirm.emit()" [disabled]="submitting()">
          @if (submitting()) {
            Submitting...
          } @else {
            Confirm Update
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    h3 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
    }
    .warning-text {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
    .diff-card, .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .diff-row, .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      color: #1e293b;
      font-weight: 600;
    }
    .new-value {
      color: #0f172a;
      font-size: 16px;
    }
    .highlight {
      padding-top: 12px;
      margin-top: 4px;
      border-top: 1px dashed #cbd5e1;
    }
    .change-value.positive {
      color: #16a34a;
    }
    .change-value.negative {
      color: #dc2626;
    }
    .italic {
      font-style: italic;
      font-weight: 400;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .btn-cancel {
      padding: 10px 16px;
      background: transparent;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      color: #475569;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-cancel:hover:not(:disabled) {
      background: #f1f5f9;
    }
    .btn-primary {
      padding: 10px 16px;
      background: #16a34a;
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) {
      background: #15803d;
    }
    .btn-cancel:disabled, .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SalaryChangePreviewComponent {
  currentSalary = input.required<number>();
  currency = input.required<string>();
  formValue = input.required<SalaryUpdateFormValue>();
  submitting = input<boolean>(false);

  confirm = output<void>();
  back = output<void>();

  getChangeAmount(): number {
    return this.formValue().newSalary - this.currentSalary();
  }

  getChangePercentage(): number {
    if (this.currentSalary() === 0) return 0;
    return this.getChangeAmount() / this.currentSalary();
  }
}
