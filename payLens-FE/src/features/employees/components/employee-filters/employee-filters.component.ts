import { Component, input, output, OnInit, DestroyRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface EmployeeFilterState {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  employmentStatus?: string;
}

@Component({
  selector: 'app-employee-filters',
  imports: [ReactiveFormsModule],
  template: `
    <div class="filters-container">
      <div class="filter-group filter-group--search">
        <label for="search" class="filter-label">Search</label>
        <input 
          id="search" 
          type="text" 
          class="filter-input" 
          [formControl]="searchControl" 
          placeholder="Name or ID..." 
        />
      </div>

      <div class="filter-group">
        <label for="country" class="filter-label">Country</label>
        <select id="country" class="filter-select" [formControl]="countryControl">
          <option value="">All Countries</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Germany">Germany</option>
          <option value="India">India</option>
          <option value="Canada">Canada</option>
          <option value="Australia">Australia</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="department" class="filter-label">Department</label>
        <select id="department" class="filter-select" [formControl]="departmentControl">
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
          <option value="Product">Product</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="jobTitle" class="filter-label">Job Title</label>
        <select id="jobTitle" class="filter-select" [formControl]="jobTitleControl">
          <option value="">All Job Titles</option>
          <option value="Senior Software Engineer">Senior Software Engineer</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Product Manager">Product Manager</option>
          <option value="Sales Director">Sales Director</option>
          <option value="Marketing Specialist">Marketing Specialist</option>
          <option value="HR Manager">HR Manager</option>
          <option value="Financial Analyst">Financial Analyst</option>
          <option value="Operations Manager">Operations Manager</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="status" class="filter-label">Status</label>
        <select id="status" class="filter-select" [formControl]="statusControl">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      <div class="filter-actions">
        <button class="btn-clear" (click)="clearFilters()" type="button" aria-label="Clear all filters">
          Clear Filters
        </button>
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
      background: #ffffff;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 150px;
    }
    .filter-group--search {
      flex: 2;
      min-width: 250px;
    }
    .filter-label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
    .filter-input, .filter-select {
      height: 38px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      color: #1e293b;
      background-color: #f8fafc;
      outline: none;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .filter-input:focus, .filter-select:focus {
      border-color: #3b82f6;
      background-color: #ffffff;
    }
    .filter-actions {
      display: flex;
      align-items: center;
      height: 38px;
    }
    .btn-clear {
      padding: 0 16px;
      height: 38px;
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-clear:hover {
      background: #f1f5f9;
      color: #334155;
    }
  `]
})
export class EmployeeFiltersComponent implements OnInit {
  initialState = input<EmployeeFilterState>({});
  filtersChanged = output<EmployeeFilterState>();

  searchControl = new FormControl<string>('');
  countryControl = new FormControl<string>('');
  departmentControl = new FormControl<string>('');
  jobTitleControl = new FormControl<string>('');
  statusControl = new FormControl<string>('');

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const state = this.initialState();
    if (state.search) this.searchControl.setValue(state.search, { emitEvent: false });
    if (state.country) this.countryControl.setValue(state.country, { emitEvent: false });
    if (state.department) this.departmentControl.setValue(state.department, { emitEvent: false });
    if (state.jobTitle) this.jobTitleControl.setValue(state.jobTitle, { emitEvent: false });
    if (state.employmentStatus) this.statusControl.setValue(state.employmentStatus, { emitEvent: false });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.emitChanges());

    this.jobTitleControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.emitChanges());

    this.countryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitChanges());

    this.departmentControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitChanges());

    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitChanges());
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.countryControl.setValue('', { emitEvent: false });
    this.departmentControl.setValue('', { emitEvent: false });
    this.jobTitleControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.emitChanges();
  }

  private emitChanges(): void {
    this.filtersChanged.emit({
      search: this.searchControl.value || undefined,
      country: this.countryControl.value || undefined,
      department: this.departmentControl.value || undefined,
      jobTitle: this.jobTitleControl.value || undefined,
      employmentStatus: this.statusControl.value || undefined
    });
  }
}
