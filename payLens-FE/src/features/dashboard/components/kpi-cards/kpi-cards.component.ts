import { Component, Input, computed, signal } from '@angular/core';
import { KpiData } from '../../models/dashboard.model';

type KpiKey = keyof KpiData;

interface KpiCard {
  key: KpiKey;
  label: string;
  value: string;
  subtext: string;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

@Component({
  selector: 'app-kpi-cards',
  template: `
    <section class="kpi-cards" aria-label="Key compensation metrics">
      @for (card of cards(); track card.key) {
        <article class="kpi-card">
          <p class="kpi-card__label">{{ card.label }}</p>
          <p class="kpi-card__value">{{ card.value }}</p>
          <p class="kpi-card__subtext">{{ card.subtext }}</p>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .kpi-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .kpi-card__label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0;
      }
      .kpi-card__value {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        line-height: 1.2;
      }
      .kpi-card__subtext {
        font-size: 12px;
        color: #94a3b8;
        margin: 0;
      }
      @media (max-width: 768px) {
        .kpi-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class KpiCardsComponent {
  private readonly _data = signal<KpiData | null>(null);

  @Input({ required: true })
  set data(value: KpiData) {
    this._data.set(value);
  }

  cards = computed<KpiCard[]>(() => {
    const d = this._data();
    if (!d) return [];
    return [
      {
        key: 'totalEmployees',
        label: 'Total Employees',
        value: formatNumber(d.totalEmployees),
        subtext: 'Active across all locations',
      },
      {
        key: 'totalAnnualPayroll',
        label: 'Total Annual Payroll',
        value: formatCurrency(d.totalAnnualPayroll),
        subtext: 'Base salary + bonuses',
      },
      {
        key: 'averageSalary',
        label: 'Average Salary',
        value: formatCurrency(d.averageSalary),
        subtext: 'Per employee per year',
      },
      {
        key: 'countries',
        label: 'Countries',
        value: formatNumber(d.countries),
        subtext: 'Global offices',
      },
    ];
  });
}
