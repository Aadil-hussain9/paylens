import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  AnalyticsFilters, 
  CompensationSummaryData, 
  SalaryDistributionBucket, 
  DepartmentAnalytics, 
  CountryAnalytics, 
  SalaryRangeAnalytics 
} from '../models/analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly mockDelay = 600;

  private generateSeed(filters: AnalyticsFilters): number {
    const key = `${filters.country || ''}${filters.department || ''}${filters.role || ''}${filters.employmentStatus || ''}`;
    return key.length > 0 ? key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42;
  }

  getSummary(filters: AnalyticsFilters): Observable<CompensationSummaryData> {
    const seed = this.generateSeed(filters);
    
    // Simulate empty state
    if (filters.country === 'NonExistent') {
      return of({
        totalEmployees: 0,
        totalPayroll: 0,
        averageSalary: 0,
        medianSalary: 0,
        reportingCurrency: 'USD'
      }).pipe(delay(this.mockDelay));
    }
    
    // Simulate random failure (10% chance) unless filters are completely empty (for initial load stability)
    if (seed !== 42 && Math.random() < 0.1) {
      return throwError(() => new Error('Analytics API Error')).pipe(delay(this.mockDelay));
    }

    const baseEmps = 10000;
    const factor = seed === 42 ? 1 : (seed % 100) / 100;
    const emps = Math.max(1, Math.floor(baseEmps * factor));
    const avg = 95000 + (seed % 20000);

    return of({
      totalEmployees: emps,
      totalPayroll: emps * avg,
      averageSalary: avg,
      medianSalary: avg * 0.95,
      reportingCurrency: 'USD' // Normalized reporting currency
    }).pipe(delay(this.mockDelay));
  }

  getDistribution(filters: AnalyticsFilters): Observable<SalaryDistributionBucket[]> {
    const seed = this.generateSeed(filters);
    
    if (filters.country === 'NonExistent') return of([]).pipe(delay(this.mockDelay));

    const total = seed === 42 ? 10000 : Math.max(10, Math.floor(10000 * ((seed % 100) / 100)));
    
    // Create a bell-curve like distribution
    return of([
      { rangeLabel: '$0 - 50k', employeeCount: Math.floor(total * 0.1) },
      { rangeLabel: '$50k - 100k', employeeCount: Math.floor(total * 0.35) },
      { rangeLabel: '$100k - 150k', employeeCount: Math.floor(total * 0.4) },
      { rangeLabel: '$150k - 200k', employeeCount: Math.floor(total * 0.1) },
      { rangeLabel: '$200k+', employeeCount: Math.floor(total * 0.05) },
    ]).pipe(delay(this.mockDelay));
  }

  getByDepartment(filters: AnalyticsFilters): Observable<DepartmentAnalytics[]> {
    const seed = this.generateSeed(filters);
    
    if (filters.country === 'NonExistent') return of([]).pipe(delay(this.mockDelay));
    if (filters.department) {
      // If filtered to a specific department, only return one row
      return of([
        {
          department: filters.department,
          employeeCount: 1500,
          averageSalary: 110000 + (seed % 10000),
          medianSalary: 105000 + (seed % 10000),
          totalPayroll: 1500 * (110000 + (seed % 10000)),
          currency: 'USD'
        }
      ]).pipe(delay(this.mockDelay));
    }

    const depts = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product'];
    const result = depts.map((dept, index) => {
      const emps = 500 + ((seed + index * 100) % 1500);
      const avg = 80000 + ((seed + index * 5000) % 50000);
      return {
        department: dept,
        employeeCount: emps,
        averageSalary: avg,
        medianSalary: avg * 0.95,
        totalPayroll: emps * avg,
        currency: 'USD'
      };
    });
    
    // Sort by total payroll desc
    result.sort((a, b) => b.totalPayroll - a.totalPayroll);
    
    return of(result).pipe(delay(this.mockDelay));
  }

  getByCountry(filters: AnalyticsFilters): Observable<CountryAnalytics[]> {
    const seed = this.generateSeed(filters);
    
    if (filters.country === 'NonExistent') return of([]).pipe(delay(this.mockDelay));
    
    if (filters.country) {
      return of([
        {
          country: filters.country,
          employeeCount: 2000,
          averageSalary: 90000,
          medianSalary: 85000,
          totalPayroll: 180000000,
          currency: 'USD' // Kept normalized for summary comparison
        }
      ]).pipe(delay(this.mockDelay));
    }

    const countries = ['United States', 'United Kingdom', 'Germany', 'India', 'Canada', 'Australia'];
    const result = countries.map((c, index) => {
      const emps = 300 + ((seed + index * 200) % 2000);
      let avg = 70000 + ((seed + index * 3000) % 40000);
      if (c === 'India') avg = 30000;
      if (c === 'United States') avg = 120000;
      
      return {
        country: c,
        employeeCount: emps,
        averageSalary: avg,
        medianSalary: avg * 0.95,
        totalPayroll: emps * avg,
        currency: 'USD'
      };
    });

    result.sort((a, b) => b.totalPayroll - a.totalPayroll);
    return of(result).pipe(delay(this.mockDelay));
  }

  getSalaryRanges(filters: AnalyticsFilters): Observable<SalaryRangeAnalytics> {
    const seed = this.generateSeed(filters);
    if (filters.country === 'NonExistent') {
      return of({
        min: 0, p25: 0, median: 0, p75: 0, max: 0, currency: 'USD'
      }).pipe(delay(this.mockDelay));
    }
    
    const median = 95000 + (seed % 20000);
    return of({
      min: median * 0.4,
      p25: median * 0.75,
      median: median,
      p75: median * 1.3,
      max: median * 2.5,
      currency: 'USD'
    }).pipe(delay(this.mockDelay));
  }
}
