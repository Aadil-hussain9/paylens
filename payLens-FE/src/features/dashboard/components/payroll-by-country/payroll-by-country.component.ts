import { Component, Input, computed, signal } from '@angular/core';
import { CountryPayroll } from '../../models/dashboard.model';

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

@Component({
  selector: 'app-payroll-by-country',
  template: `
    <section class="chart-section" aria-label="Payroll by country">
      <h2 class="chart-section__title">Payroll by Country</h2>
      <p class="chart-section__subtitle">
        Total annual payroll and headcount per country
      </p>
      <div class="country-list">
        @for (item of countriesWithWidth(); track item.countryCode) {
          <div class="country-row">
            <div class="country-row__header">
              <span class="country-row__name">{{ item.country }}</span>
              <span class="country-row__amount">{{ formatCompact(item.totalPayroll) }}</span>
            </div>
            <div class="country-row__track">
              <div
                class="country-row__bar"
                [style.width.%]="item.widthPercent"
                [attr.title]="item.country + ': ' + item.employeeCount + ' employees'"
              ></div>
            </div>
            <span class="country-row__count">{{ item.employeeCount.toLocaleString() }} employees</span>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .chart-section {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 24px;
      }
      .chart-section__title {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }
      .chart-section__subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 20px;
      }
      .country-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .country-row__header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 6px;
      }
      .country-row__name {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .country-row__amount {
        font-size: 14px;
        font-weight: 700;
        color: #0f4c75;
      }
      .country-row__track {
        height: 10px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
      }
      .country-row__bar {
        height: 100%;
        background: #3282b8;
        border-radius: 4px;
        transition: width 0.3s ease;
        min-width: 2px;
      }
      .country-row__count {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 4px;
        display: block;
      }
    `,
  ],
})
export class PayrollByCountryComponent {
  private readonly _countries = signal<CountryPayroll[]>([]);

  @Input({ required: true })
  set countries(value: CountryPayroll[]) {
    this._countries.set(value);
  }

  countriesWithWidth = computed(() => {
    const countries = this._countries();
    if (countries.length === 0) return [];
    const max = Math.max(...countries.map((c) => c.totalPayroll));
    return countries.map((c) => ({
      ...c,
      widthPercent: max > 0 ? (c.totalPayroll / max) * 100 : 0,
    }));
  });

  formatCompact = formatCompact;
}
