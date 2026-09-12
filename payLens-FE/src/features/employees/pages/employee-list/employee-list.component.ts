import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { EmployeeService } from '../../services/employee.service';
import { EmployeeQuery, PagedResponse, Employee } from '../../models/employee.model';
import { EmployeeFiltersComponent, EmployeeFilterState } from '../../components/employee-filters/employee-filters.component';
import { EmployeeTableComponent, SortColumn, SortDirection } from '../../components/employee-table/employee-table.component';
import { EmployeePaginationComponent } from '../../components/employee-pagination/employee-pagination.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

type LoadState = 'loading' | 'loaded' | 'error' | 'empty';

@Component({
  selector: 'app-employee-list',
  imports: [
    EmployeeFiltersComponent,
    EmployeeTableComponent,
    EmployeePaginationComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div>
          <h1 class="page__title">Employees</h1>
          <p class="page__subtitle">
            Manage your organization's {{ data()?.totalElements || '...' }} employees
          </p>
        </div>
      </header>

      <app-employee-filters 
        [initialState]="query()" 
        (filtersChanged)="onFiltersChanged($event)"
      />

      @switch (state()) {
        @case ('loading') {
          <app-loading-state message="Searching employee directory..." />
        }
        @case ('error') {
          <app-error-state
            title="Failed to load employees"
            message="We couldn't retrieve the employee directory. Please try again."
            (retry)="reload()"
          />
        }
        @case ('empty') {
          <app-empty-state
            title="No employees found"
            message="No employees match your current filters."
          >
            <button class="btn-reset" (click)="resetFilters()">Clear Filters</button>
          </app-empty-state>
        }
        @case ('loaded') {
          @if (data(); as d) {
            <app-employee-table 
              class="flex-table"
              [employees]="d.content"
              [currentSort]="query().sortBy"
              [currentDirection]="query().sortDirection"
              (sortChanged)="onSortChanged($event.column, $event.direction)"
              (employeeClicked)="onEmployeeClicked($event)"
            />
            
            <app-employee-pagination 
              [currentPage]="d.page"
              [pageSize]="d.pageSize"
              [totalElements]="d.totalElements"
              [totalPages]="d.totalPages"
              (pageChanged)="onPageChanged($event)"
              (pageSizeChanged)="onPageSizeChanged($event)"
            />
          }
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 1;
        position: relative;
        min-height: 0;
      }
      .page { 
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        max-width: 1200px;
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
      }
      .flex-table {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .page__header {
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .page__title { 
        font-size: 24px; 
        font-weight: 700; 
        color: #1e293b; 
        margin: 0 0 4px; 
      }
      .page__subtitle { 
        font-size: 15px; 
        color: #64748b; 
        margin: 0;
      }
      .btn-reset {
        margin-top: 16px;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
      }
      .btn-reset:hover {
        background: #2563eb;
      }
    `,
  ],
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  // State
  readonly query = signal<EmployeeQuery>({
    page: 1,
    pageSize: 25,
    search: '',
    country: '',
    department: '',
    jobTitle: '',
    employmentStatus: '',
    sortBy: 'name',
    sortDirection: 'asc'
  });

  readonly state = signal<LoadState>('loading');
  readonly data = signal<PagedResponse<Employee> | null>(null);

  constructor() {
    // Automatically fetch data when query changes
    toObservable(this.query)
      .pipe(
        switchMap((query) => {
          this.state.set('loading');
          return this.employeeService.getEmployees(query).pipe(
            catchError((err) => {
              this.state.set('error');
              return of(null);
            })
          );
        })
      )
      .subscribe((result) => {
        if (result) {
          if (result.content.length === 0) {
            this.state.set('empty');
          } else {
            this.data.set(result);
            this.state.set('loaded');
          }
        }
      });
  }

  ngOnInit(): void {
    // Initial fetch is triggered automatically by the query signal initialization
  }

  onFiltersChanged(filters: EmployeeFilterState): void {
    this.query.update(q => ({
      ...q,
      ...filters,
      page: 1 // Reset to first page on filter change
    }));
  }

  onSortChanged(sortBy: SortColumn, sortDirection: SortDirection): void {
    this.query.update(q => ({
      ...q,
      sortBy,
      sortDirection,
      page: 1 // Reset to first page on sort change
    }));
  }

  onPageChanged(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }

  onPageSizeChanged(pageSize: number): void {
    this.query.update(q => ({ ...q, pageSize, page: 1 }));
  }

  resetFilters(): void {
    this.query.update(q => ({
      ...q,
      search: '',
      country: '',
      department: '',
      jobTitle: '',
      employmentStatus: '',
      page: 1
    }));
  }

  reload(): void {
    // Force a reload by re-emitting the current query (cloning to trigger update)
    this.query.update(q => ({ ...q }));
  }

  onEmployeeClicked(employee: Employee): void {
    this.router.navigate(['/employees', employee.id]);
  }
}
