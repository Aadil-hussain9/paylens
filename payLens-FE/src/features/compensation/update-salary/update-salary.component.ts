import { Component, input, output, OnInit, inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { EmployeeDetails } from '../../employees/models/employee.models';
import { UpdateSalaryRequest } from '../models/compensation.models';
import { CompensationService } from '../compensation.service/compensation.service';

type WorkflowState = 'editing' | 'previewing' | 'submitting';

@Component({
  selector: 'app-update-salary',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="workflow-overlay">
      <div class="workflow-modal">
        
        <div class="modal-header">
          <h2>Update Current Salary</h2>
          <button class="close-btn" (click)="cancel.emit()" [disabled]="state() === 'submitting'" aria-label="Close">×</button>
        </div>

        <div class="modal-body">
          <div class="employee-context">
            <span class="avatar" aria-hidden="true">{{ employee().firstName[0] }}{{ employee().lastName[0] }}</span>
            <div class="info">
              <strong>{{ employee().firstName }} {{ employee().lastName }}</strong>
              <span>{{ employee().jobTitle }}</span>
            </div>
          </div>

          @if (state() === 'editing') {
            <form [formGroup]="form" (ngSubmit)="onPreview()" class="edit-form">
              <div class="form-group read-only">
                <label>Current Base Salary</label>
                <div class="input-display">{{ employee().currentSalary | currency:employee().currency:'symbol':'1.0-0' }} {{ employee().currency }}</div>
              </div>

              <div class="form-row">
                <div class="form-group flex-2">
                  <label for="newSalary">New Base Salary</label>
                  <input type="number" id="newSalary" formControlName="newSalary" placeholder="Enter amount">
                  @if (form.get('newSalary')?.invalid && form.get('newSalary')?.touched) {
                    <span class="error-msg">Valid positive salary is required.</span>
                  }
                </div>
                <div class="form-group flex-1">
                  <label for="currency">Currency</label>
                  <input type="text" id="currency" formControlName="currency" readonly>
                </div>
              </div>

              <div class="form-group">
                <label for="reason">Reason for Update</label>
                <select id="reason" formControlName="reason">
                  <option value="" disabled selected>Select a reason...</option>
                  <option value="Annual Review">Annual Review</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Role Change">Role Change</option>
                  <option value="Market Adjustment">Market Adjustment</option>
                  <option value="Correction">Correction</option>
                  <option value="Other">Other</option>
                </select>
                @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
                  <span class="error-msg">Reason is required.</span>
                }
              </div>

              @if (apiError()) {
                <div class="error-alert">
                  <strong>Update Failed:</strong> {{ apiError() }}
                </div>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Review Change</button>
              </div>
            </form>
          }

          @if (state() === 'previewing' || state() === 'submitting') {
            <div class="preview-section">
              <div class="alert alert-warning">
                <strong>Confirm Salary Update?</strong>
                <p>Please review the proposed base salary change for {{ employee().firstName }} {{ employee().lastName }}.</p>
              </div>

              <div class="preview-grid">
                <div class="preview-item">
                  <span class="preview-label">Current Salary</span>
                  <span class="preview-value">{{ employee().currentSalary | currency:employee().currency:'symbol':'1.0-0' }}</span>
                </div>
                <div class="preview-item highlight">
                  <span class="preview-label">New Salary</span>
                  <span class="preview-value">{{ form.value.newSalary | currency:employee().currency:'symbol':'1.0-0' }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Change Amount</span>
                  <span class="preview-value change" [class.positive]="changeAmount() > 0" [class.negative]="changeAmount() < 0">
                    {{ changeAmount() > 0 ? '+' : '' }}{{ changeAmount() | currency:employee().currency:'symbol':'1.0-0' }} 
                    ({{ changePercentage() | number:'1.1-1' }}%)
                  </span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Reason</span>
                  <span class="preview-value">{{ form.value.reason }}</span>
                </div>
              </div>

              @if (apiError()) {
                <div class="error-alert">
                  <strong>Update Failed:</strong> {{ apiError() }}
                </div>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="state.set('editing')" [disabled]="state() === 'submitting'">Back to Edit</button>
                <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="state() === 'submitting'">
                  @if (state() === 'submitting') {
                    <span class="spinner" aria-hidden="true"></span> Processing...
                  } @else {
                    Confirm Update
                  }
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflow-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .workflow-modal {
      background: white;
      width: 100%;
      max-width: 550px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: modalSlideUp 0.3s ease-out;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 24px;
      color: #64748b;
      cursor: pointer;
    }
    .modal-body {
      padding: 24px;
    }
    .employee-context {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 50%;
      font-weight: 600;
    }
    .info strong { display: block; font-size: 15px; color: #1e293b; }
    .info span { font-size: 13px; color: #64748b; }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 15px;
      box-sizing: border-box;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .form-group input[readonly] {
      background: #f1f5f9;
      color: #64748b;
      cursor: not-allowed;
    }
    .input-display {
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      font-size: 15px;
      color: #475569;
      font-weight: 500;
    }
    .error-msg {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #ef4444;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .btn {
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; }
    .btn-secondary:hover:not(:disabled) { background: #f8fafc; }
    .btn-primary { background: #3b82f6; border: 1px solid #2563eb; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }

    .preview-section {
      animation: fadeIn 0.3s;
    }
    .alert {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .alert strong { display: block; margin-bottom: 4px; }
    .alert p { margin: 0; font-size: 14px; }
    
    .error-alert {
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #991b1b;
      font-size: 14px;
      margin-top: 16px;
    }

    .preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .preview-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .preview-label { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; }
    .preview-value { font-size: 16px; font-weight: 600; color: #1e293b; }
    .preview-item.highlight .preview-value { color: #2563eb; font-size: 18px; }
    .change.positive { color: #16a34a; }
    .change.negative { color: #dc2626; }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UpdateSalaryComponent implements OnInit {
  employee = input.required<EmployeeDetails>();
  
  cancel = output<void>();
  success = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly compensationService = inject(CompensationService);

  state = signal<WorkflowState>('editing');
  apiError = signal<string | null>(null);
  
  form: FormGroup;

  changeAmount = computed(() => {
    const newSalary = this.form.get('newSalary')?.value || 0;
    return newSalary - this.employee().currentSalary;
  });

  changePercentage = computed(() => {
    const amount = this.changeAmount();
    return (amount / this.employee().currentSalary) * 100;
  });

  constructor() {
    this.form = this.fb.group({
      newSalary: [null, [Validators.required, Validators.min(1)]],
      currency: [''],
      reason: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Initialize form with employee defaults
    this.form.patchValue({
      currency: this.employee().currency
    });
  }

  onPreview() {
    if (this.form.valid) {
      this.apiError.set(null);
      this.state.set('previewing');
    } else {
      this.form.markAllAsTouched();
    }
  }

  onSubmit() {
    this.state.set('submitting');
    this.apiError.set(null);

    const request: UpdateSalaryRequest = {
      newSalary: this.form.value.newSalary,
      currency: this.form.value.currency,
      reason: this.form.value.reason
    };

    this.compensationService.updateSalary(this.employee().id, request).subscribe({
      next: () => {
        // We do NOT optimistic update locally. We emit success and let the parent re-fetch.
        this.success.emit();
      },
      error: (err: Error) => {
        this.apiError.set(err.message || 'Unable to update the salary. The current employee data may have changed. Please refresh and try again.');
        this.state.set('previewing');
      }
    });
  }
}
