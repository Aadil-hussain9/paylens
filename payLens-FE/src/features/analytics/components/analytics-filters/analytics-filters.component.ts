import { Component, output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnalyticsFilters } from '../../models/analytics.models';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-analytics-filters',
  imports: [ReactiveFormsModule],
  template: `
    <div class="filters-container">
      <form [formGroup]="filterForm" class="filter-form">
        <div class="form-group">
          <label for="country">Country</label>
          <select id="country" formControlName="country" class="form-control">
            <option value="">All Countries</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="India">India</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="NonExistent">Non Existent (Test Empty)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="department">Department</label>
          <select id="department" formControlName="department" class="form-control">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Product">Product</option>
          </select>
        </div>

        <div class="form-group">
          <label for="employmentStatus">Status</label>
          <select id="employmentStatus" formControlName="employmentStatus" class="form-control">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>

        <div class="actions">
          <button type="button" class="btn-clear" (click)="clearFilters()" [disabled]="!isFiltered()">
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .filters-container {
      background: #ffffff;
      padding: 16px 24px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 200px;
      flex: 1;
    }
    label {
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }
    .form-control {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      color: #0f172a;
      outline: none;
      background-color: #fff;
    }
    .form-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .actions {
      display: flex;
      align-items: center;
    }
    .btn-clear {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      color: #475569;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      height: 37px;
      transition: all 0.2s;
    }
    .btn-clear:hover:not(:disabled) {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-clear:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class AnalyticsFiltersComponent implements OnInit, OnDestroy {
  filtersChanged = output<AnalyticsFilters>();
  
  filterForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      country: [''],
      department: [''],
      employmentStatus: ['']
    });
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        // Clean up empty strings to undefined to keep the payload clean
        const cleaned: AnalyticsFilters = {};
        if (value.country) cleaned.country = value.country;
        if (value.department) cleaned.department = value.department;
        if (value.employmentStatus) cleaned.employmentStatus = value.employmentStatus;
        
        this.filtersChanged.emit(cleaned);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearFilters(): void {
    this.filterForm.reset({
      country: '',
      department: '',
      employmentStatus: ''
    });
  }

  isFiltered(): boolean {
    const vals = this.filterForm.value;
    return !!(vals.country || vals.department || vals.employmentStatus);
  }
}
