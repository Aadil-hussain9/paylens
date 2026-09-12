import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { EmployeeDetailComponent } from './employee-detail.component';
import { EmployeeService } from '../../services/employee.service';
import { CompensationService } from '../../services/compensation.service';
import { Employee } from '../../models/employee.model';
import { CompensationSummary, SalaryHistoryEntry } from '../../models/compensation.model';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('EmployeeDetailComponent', () => {
  let mockEmployeeService: any;
  let mockCompensationService: any;
  let mockRoute: any;

  const mockEmployee: Employee = {
    id: 'EMP-1',
    name: 'John Doe',
    jobTitle: 'Developer',
    department: 'Engineering',
    country: 'United States',
    salary: 100000,
    currency: 'USD',
    employmentStatus: 'Active'
  };

  const mockSummary: CompensationSummary = {
    employeeId: 'EMP-1',
    currentSalary: 100000,
    currency: 'USD',
    departmentAverage: 90000,
    companyAverage: 80000
  };

  const mockHistory: SalaryHistoryEntry[] = [
    {
      id: 'SH-1',
      employeeId: 'EMP-1',
      effectiveDate: '2026-01-01',
      previousSalary: 90000,
      newSalary: 100000,
      currency: 'USD',
      changePercentage: 11.1,
      reason: 'Annual Review',
      changedBy: 'System'
    }
  ];

  beforeEach(() => {
    mockEmployeeService = {
      getEmployeeById: jasmine.createSpy('getEmployeeById').and.returnValue(of(mockEmployee))
    };

    mockCompensationService = {
      getCompensationSummary: jasmine.createSpy('getCompensationSummary').and.returnValue(of(mockSummary)),
      getSalaryHistory: jasmine.createSpy('getSalaryHistory').and.returnValue(of(mockHistory))
    };

    mockRoute = {
      paramMap: of({ get: () => 'EMP-1' }),
      snapshot: { paramMap: { get: () => 'EMP-1' } }
    };

    TestBed.configureTestingModule({
      imports: [EmployeeDetailComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: CompensationService, useValue: mockCompensationService },
        { provide: ActivatedRoute, useValue: mockRoute }
      ]
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(EmployeeDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create and load data on init', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.state()).toBe('loaded');
    expect(mockEmployeeService.getEmployeeById).toHaveBeenCalledWith('EMP-1');
    expect(mockCompensationService.getCompensationSummary).toHaveBeenCalledWith('EMP-1');
    expect(mockCompensationService.getSalaryHistory).toHaveBeenCalledWith('EMP-1');
  });

  it('should render all sections when loaded', () => {
    const fixture = setup();
    const nativeElement = fixture.nativeElement;
    
    expect(nativeElement.querySelector('app-employee-summary')).toBeTruthy();
    expect(nativeElement.querySelector('app-compensation-summary')).toBeTruthy();
    expect(nativeElement.querySelector('app-salary-history')).toBeTruthy();
  });

  it('should display loading state initially', async () => {
    mockEmployeeService.getEmployeeById.and.returnValue(
      new Promise(resolve => setTimeout(() => resolve(mockEmployee), 100))
    );
    const fixture = TestBed.createComponent(EmployeeDetailComponent);
    fixture.detectChanges();
    
    expect(fixture.componentInstance.state()).toBe('loading');
    expect(fixture.nativeElement.querySelector('app-loading-state')).toBeTruthy();
  });

  it('should handle employee not found (404)', () => {
    mockEmployeeService.getEmployeeById.and.returnValue(throwError(() => new Error('Employee not found')));
    
    const fixture = setup();
    expect(fixture.componentInstance.state()).toBe('not-found');
    expect(fixture.nativeElement.querySelector('app-empty-state[title="Employee Not Found"]')).toBeTruthy();
  });

  it('should handle generic API error', () => {
    mockEmployeeService.getEmployeeById.and.returnValue(throwError(() => new Error('Server error')));
    
    const fixture = setup();
    expect(fixture.componentInstance.state()).toBe('error');
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
  });

  it('should display empty history component when history is empty', () => {
    mockCompensationService.getSalaryHistory.and.returnValue(of([]));
    const fixture = setup();
    
    // Check that salary history component handles the empty array
    const salaryHistoryEl = fixture.nativeElement.querySelector('app-salary-history');
    expect(salaryHistoryEl).toBeTruthy();
    expect(salaryHistoryEl.innerHTML).toContain('No history available');
  });
});
