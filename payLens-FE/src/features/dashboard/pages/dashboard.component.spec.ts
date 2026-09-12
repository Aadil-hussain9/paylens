import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../services/dashboard.service';
import { DashboardData } from '../models/dashboard.model';
import { MOCK_DASHBOARD_DATA } from '../data/mock-dashboard-data';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

describe('DashboardComponent', () => {
  function createMockService(data: DashboardData | null, shouldError = false) {
    return {
      getDashboardData: () =>
        shouldError
          ? throwError(() => new Error('API error'))
          : of(data ?? MOCK_DASHBOARD_DATA),
    };
  }

  function setup(mockService: object) {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: DashboardService, useValue: mockService },
      ],
    });
    return TestBed.createComponent(DashboardComponent);
  }

  it('should create', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render KPI cards with data', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    const kpiCards = fixture.nativeElement.querySelectorAll('.kpi-card');
    expect(kpiCards.length).toBe(4);

    const firstCardLabel =
      fixture.nativeElement.querySelector('.kpi-card__label').textContent;
    expect(firstCardLabel).toContain('Total Employees');

    const firstCardValue =
      fixture.nativeElement.querySelector('.kpi-card__value').textContent;
    expect(firstCardValue).toContain('10,247');
  });

  it('should render the compensation question heading', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.dashboard__question');
    expect(heading.textContent).toContain('How does our organization pay people?');
  });

  it('should render salary distribution chart', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('app-salary-distribution');
    expect(section).not.toBeNull();
    const rows = fixture.nativeElement.querySelectorAll('.bar-chart__row');
    expect(rows.length).toBe(MOCK_DASHBOARD_DATA.salaryDistribution.length);
  });

  it('should render payroll by country chart', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('app-payroll-by-country');
    expect(section).not.toBeNull();
    const rows = fixture.nativeElement.querySelectorAll('.country-row');
    expect(rows.length).toBe(MOCK_DASHBOARD_DATA.payrollByCountry.length);
  });

  it('should render department salary table', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('app-department-salary');
    expect(section).not.toBeNull();
    const rows = fixture.nativeElement.querySelectorAll('.dept-table__row');
    expect(rows.length).toBe(MOCK_DASHBOARD_DATA.salaryByDepartment.length);
  });

  it('should render compensation insights', () => {
    const fixture = setup(createMockService(null));
    fixture.detectChanges();
    const section =
      fixture.nativeElement.querySelector('app-compensation-insights');
    expect(section).not.toBeNull();
    const items = fixture.nativeElement.querySelectorAll('.insight');
    expect(items.length).toBe(MOCK_DASHBOARD_DATA.insights.length);
  });

  it('should show loading state initially', () => {
    const slowService = {
      getDashboardData: () => of(MOCK_DASHBOARD_DATA).pipe(delay(5000)),
    };
    const fixture = setup(slowService);
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector('app-loading-state');
    expect(loading).not.toBeNull();
    const data = fixture.nativeElement.querySelector('.kpi-card');
    expect(data).toBeNull();
  });

  it('should show error state when service fails', () => {
    const fixture = setup(createMockService(null, true));
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('app-error-state');
    expect(error).not.toBeNull();
    const title = fixture.nativeElement.querySelector('.error-state__title');
    expect(title.textContent).toContain('Failed to load dashboard');
  });

  it('should show empty state when data has no employees or charts', () => {
    const emptyData: DashboardData = {
      kpis: {
        totalEmployees: 0,
        totalAnnualPayroll: 0,
        averageSalary: 0,
        countries: 0,
      },
      salaryDistribution: [],
      payrollByCountry: [],
      salaryByDepartment: [],
      insights: [],
    };
    const fixture = setup(createMockService(emptyData));
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('app-empty-state');
    expect(empty).not.toBeNull();
    const title = fixture.nativeElement.querySelector('.empty-state__title');
    expect(title.textContent).toContain('No compensation data available');
  });

  it('should retry loading when error retry is clicked', () => {
    let callCount = 0;
    const flakyService = {
      getDashboardData: () => {
        callCount++;
        if (callCount === 1) {
          return throwError(() => new Error('API error'));
        }
        return of(MOCK_DASHBOARD_DATA);
      },
    };
    const fixture = setup(flakyService);
    fixture.detectChanges();

    const errorState = fixture.nativeElement.querySelector('app-error-state');
    expect(errorState).not.toBeNull();

    const retryButton =
      fixture.nativeElement.querySelector('.error-state__retry');
    retryButton.click();
    fixture.detectChanges();

    const kpiCards = fixture.nativeElement.querySelectorAll('.kpi-card');
    expect(kpiCards.length).toBe(4);
  });
});
