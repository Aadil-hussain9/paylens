import { Component, signal } from '@angular/core';
import { AnalyticsFilters } from '../../models/analytics.models';
import { AnalyticsFiltersComponent } from '../../components/analytics-filters/analytics-filters.component';
import { CompensationSummaryComponent } from '../../components/compensation-summary/compensation-summary.component';
import { SalaryDistributionComponent } from '../../components/salary-distribution/salary-distribution.component';
import { DepartmentAnalysisComponent } from '../../components/department-analysis/department-analysis.component';
import { CountryAnalysisComponent } from '../../components/country-analysis/country-analysis.component';
import { SalaryRangeComponent } from '../../components/salary-range/salary-range.component';

@Component({
  selector: 'app-analytics',
  imports: [
    AnalyticsFiltersComponent,
    CompensationSummaryComponent,
    SalaryDistributionComponent,
    DepartmentAnalysisComponent,
    CountryAnalysisComponent,
    SalaryRangeComponent
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Compensation Analytics</h1>
        <p class="subtitle">Understand organization-wide compensation trends and distributions.</p>
      </header>

      <app-analytics-filters (filtersChanged)="onFiltersChanged($event)" />

      <app-compensation-summary [filters]="activeFilters()" />

      <div class="grid-2-col">
        <app-salary-distribution [filters]="activeFilters()" />
        <app-salary-range [filters]="activeFilters()" />
      </div>

      <div class="grid-2-col">
        <app-department-analysis [filters]="activeFilters()" />
        <app-country-analysis [filters]="activeFilters()" />
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 28px;
      color: #0f172a;
    }
    .subtitle {
      margin: 8px 0 0 0;
      color: #64748b;
      font-size: 15px;
    }
    .grid-2-col {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    /* Let department and country sit side-by-side equally */
    .grid-2-col:last-child {
      grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 1024px) {
      .grid-2-col {
        grid-template-columns: 1fr !important;
      }
    }
  `]
})
export class AnalyticsComponent {
  activeFilters = signal<AnalyticsFilters>({});

  onFiltersChanged(filters: AnalyticsFilters) {
    this.activeFilters.set(filters);
  }
}
