import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompensationSummaryComponent } from './compensation-summary.component';
import { AnalyticsService } from '../../services/analytics.service';
import { of, throwError } from 'rxjs';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

describe('CompensationSummaryComponent', () => {
  let component: CompensationSummaryComponent;
  let fixture: ComponentFixture<CompensationSummaryComponent>;
  let mockAnalyticsService: any;

  beforeEach(async () => {
    mockAnalyticsService = {
      getSummary: jasmine.createSpy('getSummary').and.returnValue(of({
        totalEmployees: 50,
        totalPayroll: 5000000,
        averageSalary: 100000,
        medianSalary: 95000,
        reportingCurrency: 'USD'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [CompensationSummaryComponent, CurrencyPipe, DecimalPipe],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(CompensationSummaryComponent);
    component = fixture.componentInstance;
    
    // Set input
    fixture.componentRef.setInput('filters', {});
    
    fixture.detectChanges();
  });

  it('should display KPI data when loaded successfully', () => {
    expect(component.state()).toBe('loaded');
    expect(component.data()?.totalEmployees).toBe(50);
    expect(component.data()?.reportingCurrency).toBe('USD');
  });

  it('should display error state when API fails', () => {
    mockAnalyticsService.getSummary.and.returnValue(throwError(() => new Error('API Error')));
    
    // Trigger reload
    component.loadData({});
    
    expect(component.state()).toBe('error');
  });

  it('should display empty state when zero employees returned', () => {
    mockAnalyticsService.getSummary.and.returnValue(of({
      totalEmployees: 0,
      totalPayroll: 0,
      averageSalary: 0,
      medianSalary: 0,
      reportingCurrency: 'USD'
    }));
    
    component.loadData({});
    
    expect(component.state()).toBe('empty');
  });
});
