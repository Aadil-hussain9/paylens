import { Component, Input, computed, signal } from '@angular/core';
import { SalaryBand } from '../../models/dashboard.model';

@Component({
  selector: 'app-salary-distribution',
  template: `
    <section class="chart-section" aria-label="Salary distribution">
      <h2 class="chart-section__title">Salary Distribution</h2>
      <p class="chart-section__subtitle">
        Employee count by annual salary band
      </p>
      <div class="bar-chart">
        @for (band of bandsWithWidth(); track band.label) {
          <div class="bar-chart__row">
            <span class="bar-chart__label">{{ band.label }}</span>
            <div class="bar-chart__track">
              <div
                class="bar-chart__bar"
                [style.width.%]="band.widthPercent"
                [attr.title]="band.label + ': ' + band.employeeCount + ' employees'"
              ></div>
            </div>
            <span class="bar-chart__count">{{ band.employeeCount.toLocaleString() }}</span>
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
      .bar-chart {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .bar-chart__row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .bar-chart__label {
        width: 90px;
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 500;
        color: #475569;
        text-align: right;
      }
      .bar-chart__track {
        flex: 1;
        height: 28px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
      }
      .bar-chart__bar {
        height: 100%;
        background: #0f4c75;
        border-radius: 4px;
        transition: width 0.3s ease;
        min-width: 2px;
      }
      .bar-chart__count {
        width: 60px;
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        text-align: left;
      }
    `,
  ],
})
export class SalaryDistributionComponent {
  private readonly _bands = signal<SalaryBand[]>([]);

  @Input({ required: true })
  set bands(value: SalaryBand[]) {
    this._bands.set(value);
  }

  bandsWithWidth = computed(() => {
    const bands = this._bands();
    if (bands.length === 0) return [];
    const max = Math.max(...bands.map((b) => b.employeeCount));
    return bands.map((b) => ({
      ...b,
      widthPercent: max > 0 ? (b.employeeCount / max) * 100 : 0,
    }));
  });
}
