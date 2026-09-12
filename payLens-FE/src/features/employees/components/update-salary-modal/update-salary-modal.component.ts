import { Component, input, output, inject, signal } from '@angular/core';
import { CompensationService } from '../../services/compensation.service';
import { SalaryUpdateFormComponent, SalaryUpdateFormValue } from '../salary-update-form/salary-update-form.component';
import { SalaryChangePreviewComponent } from '../salary-change-preview/salary-change-preview.component';

type ModalState = 'editing' | 'reviewing' | 'submitting';

@Component({
  selector: 'app-update-salary-modal',
  imports: [SalaryUpdateFormComponent, SalaryChangePreviewComponent],
  template: `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>Update Salary</h2>
          <button class="close-btn" (click)="close.emit()" [disabled]="state() === 'submitting'">&times;</button>
        </div>
        <div class="modal-body">
          
          @if (errorMessage()) {
            <div class="alert-error">
              <strong>Update Failed:</strong> {{ errorMessage() }}
            </div>
          }

          @if (state() === 'editing') {
            <app-salary-update-form
              [currentSalary]="currentSalary()"
              [currency]="currency()"
              [initialValues]="draftValue()"
              (review)="onReview($event)"
              (cancel)="close.emit()"
            />
          } @else {
            <app-salary-change-preview
              [currentSalary]="currentSalary()"
              [currency]="currency()"
              [formValue]="draftValue()!"
              [submitting]="state() === 'submitting'"
              (back)="onBackToEdit()"
              (confirm)="onConfirm()"
            />
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
    }
    .close-btn:hover:not(:disabled) {
      color: #0f172a;
    }
    .close-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .modal-body {
      padding: 24px;
    }
    .alert-error {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      margin-bottom: 20px;
      color: #991b1b;
      font-size: 14px;
      border-radius: 4px;
    }
  `]
})
export class UpdateSalaryModalComponent {
  employeeId = input.required<string>();
  currentSalary = input.required<number>();
  currency = input.required<string>();

  close = output<void>();
  success = output<void>();

  private compensationService = inject(CompensationService);

  state = signal<ModalState>('editing');
  draftValue = signal<SalaryUpdateFormValue | undefined>(undefined);
  errorMessage = signal<string | null>(null);

  onReview(value: SalaryUpdateFormValue) {
    this.draftValue.set(value);
    this.errorMessage.set(null);
    this.state.set('reviewing');
  }

  onBackToEdit() {
    this.state.set('editing');
  }

  onConfirm() {
    const value = this.draftValue();
    if (!value) return;

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.compensationService.updateSalary({
      employeeId: this.employeeId(),
      currentSalaryBase: this.currentSalary(),
      newSalary: value.newSalary,
      currency: this.currency(),
      effectiveDate: value.effectiveDate,
      reason: value.reason,
      comment: value.comment
    }).subscribe({
      next: () => {
        this.success.emit();
      },
      error: (err) => {
        this.state.set('reviewing'); // Fallback to review state
        
        if (err.message === 'CONCURRENCY_CONFLICT') {
          this.errorMessage.set('The salary has been updated by another user since you opened this page. Please close this window and refresh the employee data.');
        } else if (err.message === 'NETWORK_ERROR') {
          this.errorMessage.set('A network error occurred while updating the salary. Please try again.');
        } else {
          this.errorMessage.set('An unexpected error occurred. Please contact support.');
        }
      }
    });
  }
}
