import { Component, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

export interface SalaryUpdateFormValue {
  newSalary: number;
  effectiveDate: string;
  reason: string;
  comment: string;
}

@Component({
  selector: 'app-salary-update-form',
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="update-form">
      
      <div class="form-group">
        <label>Current Salary</label>
        <div class="readonly-value">
          {{ currentSalary() | currency:currency():'symbol':'1.0-0' }}
        </div>
      </div>

      <div class="form-group">
        <label for="newSalary">New Salary *</label>
        <div class="input-with-currency">
          <span class="currency-label">{{ currency() }}</span>
          <input 
            type="number" 
            id="newSalary" 
            formControlName="newSalary" 
            class="form-control"
            [class.is-invalid]="isFieldInvalid('newSalary')"
          >
        </div>
        @if (isFieldInvalid('newSalary')) {
          <div class="error-msg">Please enter a valid salary greater than 0.</div>
        }
      </div>

      <div class="form-group">
        <label for="effectiveDate">Effective Date *</label>
        <input 
          type="date" 
          id="effectiveDate" 
          formControlName="effectiveDate" 
          class="form-control"
          [class.is-invalid]="isFieldInvalid('effectiveDate')"
        >
        @if (isFieldInvalid('effectiveDate')) {
          <div class="error-msg">Effective date is required.</div>
        }
      </div>

      <div class="form-group">
        <label for="reason">Reason *</label>
        <select 
          id="reason" 
          formControlName="reason" 
          class="form-control"
          [class.is-invalid]="isFieldInvalid('reason')"
        >
          <option value="">-- Select a reason --</option>
          <option value="Annual Review">Annual Review</option>
          <option value="Promotion">Promotion</option>
          <option value="Role Change">Role Change</option>
          <option value="Market Adjustment">Market Adjustment</option>
          <option value="Correction">Correction</option>
          <option value="Other">Other</option>
        </select>
        @if (isFieldInvalid('reason')) {
          <div class="error-msg">Please select a reason.</div>
        }
      </div>

      <div class="form-group">
        <label for="comment">Comment (Optional)</label>
        <textarea 
          id="comment" 
          formControlName="comment" 
          class="form-control" 
          rows="3"
          maxlength="500"
        ></textarea>
        <div class="char-count">{{ form.get('comment')?.value?.length || 0 }} / 500</div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" (click)="cancel.emit()">Cancel</button>
        <button type="submit" class="btn-primary" [disabled]="form.invalid">Review Change</button>
      </div>
    </form>
  `,
  styles: [`
    .update-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 14px;
      font-weight: 500;
      color: #334155;
    }
    .readonly-value {
      font-size: 16px;
      font-weight: 600;
      color: #64748b;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .input-with-currency {
      position: relative;
      display: flex;
      align-items: center;
    }
    .currency-label {
      position: absolute;
      left: 12px;
      color: #64748b;
      font-weight: 500;
      font-size: 14px;
    }
    .input-with-currency input {
      padding-left: 48px;
    }
    .form-control {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      color: #0f172a;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .form-control.is-invalid {
      border-color: #ef4444;
    }
    .error-msg {
      font-size: 12px;
      color: #ef4444;
      margin-top: 2px;
    }
    .char-count {
      font-size: 12px;
      color: #94a3b8;
      text-align: right;
      margin-top: 4px;
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
    .btn-cancel:hover {
      background: #f8fafc;
    }
    .btn-primary {
      padding: 10px 16px;
      background: #3b82f6;
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SalaryUpdateFormComponent implements OnInit {
  currentSalary = input.required<number>();
  currency = input.required<string>();
  
  // Accept initial values to preserve form state when navigating back from review
  initialValues = input<Partial<SalaryUpdateFormValue>>();

  review = output<SalaryUpdateFormValue>();
  cancel = output<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      newSalary: ['', [Validators.required, Validators.min(1)]],
      effectiveDate: ['', Validators.required],
      reason: ['', Validators.required],
      comment: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    if (this.initialValues()) {
      this.form.patchValue(this.initialValues()!);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  onSubmit() {
    if (this.form.valid) {
      this.review.emit(this.form.value as SalaryUpdateFormValue);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
