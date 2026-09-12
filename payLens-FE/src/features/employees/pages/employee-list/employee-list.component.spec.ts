import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { EmployeeListComponent } from './employee-list.component';
import { EmployeeService } from '../../services/employee.service';
import { PagedResponse, Employee, EmployeeQuery } from '../../models/employee.model';
import { of, throwError, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ComponentRef } from '@angular/core';
import { EmployeeFiltersComponent } from '../../components/employee-filters/employee-filters.component';
import { EmployeeTableComponent } from '../../components/employee-table/employee-table.component';
import { EmployeePaginationComponent } from '../../components/employee-pagination/employee-pagination.component';

describe('EmployeeListComponent', () => {
  let mockService: any;
  let mockEmployees: Employee[];

  beforeEach(() => {
    mockEmployees = [
      { id: 'EMP-1', name: 'John Doe', jobTitle: 'Developer', department: 'Engineering', country: 'United States', salary: 100000, currency: 'USD', employmentStatus: 'Active' },
      { id: 'EMP-2', name: 'Jane Smith', jobTitle: 'Manager', department: 'Sales', country: 'United Kingdom', salary: 120000, currency: 'GBP', employmentStatus: 'Active' },
    ];

    mockService = {
      getEmployees: jasmine.createSpy('getEmployees').and.returnValue(
        of({
          content: mockEmployees,
          page: 1,
          pageSize: 25,
          totalElements: 2,
          totalPages: 1
        } as PagedResponse<Employee>)
      )
    };

    TestBed.configureTestingModule({
      imports: [EmployeeListComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: EmployeeService, useValue: mockService }
      ]
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(EmployeeListComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render loading state initially', async () => {
    // Override to return a delayed observable
    mockService.getEmployees.and.returnValue(
      of({ content: [], page: 1, pageSize: 25, totalElements: 0, totalPages: 0 }).pipe(delay(100))
    );
    const fixture = TestBed.createComponent(EmployeeListComponent);
    fixture.detectChanges();
    
    expect(fixture.componentInstance.state()).toBe('loading');
    const loadingState = fixture.nativeElement.querySelector('app-loading-state');
    expect(loadingState).toBeTruthy();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    fixture.detectChanges();
    expect(fixture.componentInstance.state()).toBe('empty');
  });

  it('should render employee table on success', () => {
    const fixture = setup();
    expect(fixture.componentInstance.state()).toBe('loaded');
    
    const table = fixture.nativeElement.querySelector('app-employee-table');
    expect(table).toBeTruthy();
  });

  it('should show empty state when no employees match', () => {
    mockService.getEmployees.and.returnValue(
      of({
        content: [],
        page: 1,
        pageSize: 25,
        totalElements: 0,
        totalPages: 0
      } as PagedResponse<Employee>)
    );
    const fixture = setup();
    expect(fixture.componentInstance.state()).toBe('empty');
    
    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display error state on service failure', () => {
    mockService.getEmployees.and.returnValue(throwError(() => new Error('API failed')));
    const fixture = setup();
    expect(fixture.componentInstance.state()).toBe('error');
    
    const errorState = fixture.nativeElement.querySelector('app-error-state');
    expect(errorState).toBeTruthy();
  });

  it('should update query when filters change and reset page to 1', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    
    // Move to page 2 first to test page reset
    component.onPageChanged(2);
    expect(component.query().page).toBe(2);
    
    component.onFiltersChanged({ search: 'John', department: 'Engineering' });
    
    expect(component.query().search).toBe('John');
    expect(component.query().department).toBe('Engineering');
    expect(component.query().page).toBe(1); // Page should reset to 1
  });

  it('should update sort parameters and reset page to 1', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    
    component.onPageChanged(2);
    
    component.onSortChanged('salary', 'desc');
    
    expect(component.query().sortBy).toBe('salary');
    expect(component.query().sortDirection).toBe('desc');
    expect(component.query().page).toBe(1);
  });

  it('should reset filters', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    
    component.onFiltersChanged({ search: 'John', country: 'US' });
    expect(component.query().search).toBe('John');
    
    component.resetFilters();
    expect(component.query().search).toBe('');
    expect(component.query().country).toBe('');
    expect(component.query().page).toBe(1);
  });

  it('should handle pagination changes', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    
    component.onPageChanged(3);
    expect(component.query().page).toBe(3);
    
    component.onPageSizeChanged(50);
    expect(component.query().pageSize).toBe(50);
    expect(component.query().page).toBe(1); // Changing page size should reset page to 1
  });
});
