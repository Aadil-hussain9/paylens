import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  private buildParams(filters: AnalyticsFilters): HttpParams {
    let params = new HttpParams();
    if (filters.country) {
      params = params.set('country', filters.country);
    }
    if (filters.department) {
      params = params.set('department', filters.department);
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    // employmentStatus is not currently supported by backend analytics API
    return params;
  }

  getSummary(filters: AnalyticsFilters): Observable<CompensationSummaryData> {
    const params = this.buildParams(filters);
    return this.http.get<CompensationSummaryData>(`${this.apiUrl}/summary`, { params });
  }

  getDistribution(filters: AnalyticsFilters): Observable<SalaryDistributionBucket[]> {
    const params = this.buildParams(filters);
    return this.http.get<SalaryDistributionBucket[]>(`${this.apiUrl}/salary-distribution`, { params });
  }

  getByDepartment(filters: AnalyticsFilters): Observable<DepartmentAnalytics[]> {
    const params = this.buildParams(filters);
    return this.http.get<DepartmentAnalytics[]>(`${this.apiUrl}/by-department`, { params });
  }

  getByCountry(filters: AnalyticsFilters): Observable<CountryAnalytics[]> {
    const params = this.buildParams(filters);
    return this.http.get<CountryAnalytics[]>(`${this.apiUrl}/by-country`, { params });
  }

  getSalaryRanges(filters: AnalyticsFilters): Observable<SalaryRangeAnalytics> {
    const params = this.buildParams(filters);
    return this.http.get<SalaryRangeAnalytics>(`${this.apiUrl}/salary-ranges`, { params });
  }
}
