import { Component, Input, computed, signal } from '@angular/core';
import { DepartmentSalary } from '../../models/dashboard.model';

function formatK(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

@Component({
  selector: 'app-department-salary',
  template: `
    <section class="chart-section" aria-label="Salary by department">
      <h2 class="chart-section__title">Salary by Department</h2>
      <p class="chart-section__subtitle">
        Minimum, average, and maximum annual salary per department
      </p>
      <div class="dept-table">
        <div class="dept-table__header">
          <span class="dept-table__col dept-table__col--name">Department</span>
          <span class="dept-table__col dept-table__col--range">Salary Range</span>
          <span class="dept-table__col dept-table__col--headcount">Headcount</span>
        </div>
        @for (dept of departmentsNormalized(); track dept.department) {
          <div class="dept-table__row">
            <span class="dept-table__col dept-table__col--name">{{ dept.department }}</span>
            <div class="dept-table__col dept-table__col--range">
              <div class="range-bar">
                <div
                  class="range-bar__fill"
                  [style.left.%]="dept.minPercent"
                  [style.width.%]="dept.rangeWidth"
                  [attr.title]="formatK(dept.minSalary) + ' – ' + formatK(dept.maxSalary)"
                ></div>
                <span class="range-bar__avg" [style.left.%]="dept.avgPercent"></span>
              </div>
              <span class="range-bar__labels">
                {{ formatK(dept.minSalary) }} – {{ formatK(dept.maxSalary) }}
                <span class="range-bar__avg-label">avg {{ formatK(dept.avgSalary) }}</span>
              </span>
            </div>
            <span class="dept-table__col dept-table__col--headcount">{{ dept.employeeCount.toLocaleString() }}</span>
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
      .dept-table {
        display: flex;
        flex-direction: column;
      }
      .dept-table__header {
        display: flex;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 4px;
      }
      .dept-table__header .dept-table__col {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .dept-table__row {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .dept-table__row:last-child {
        border-bottom: none;
      }
      .dept-table__col--name {
        width: 160px;
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .dept-table__col--range {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .dept-table__col--headcount {
        width: 80px;
        flex-shrink: 0;
        text-align: right;
        font-size: 13px;
        font-weight: 600;
        color: #475569;
      }
      .range-bar {
        position: relative;
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
      }
      .range-bar__fill {
        position: absolute;
        top: 0;
        height: 100%;
        background: #3282b8;
        border-radius: 4px;
        transition: all 0.3s ease;
      }
      .range-bar__avg {
        position: absolute;
        top: -2px;
        width: 2px;
        height: 12px;
        background: #0f4c75;
        border-radius: 1px;
        transform: translateX(-1px);
      }
      .range-bar__labels {
        font-size: 11px;
        color: #64748b;
      }
      .range-bar__avg-label {
        color: #0f4c75;
        font-weight: 600;
        margin-left: 8px;
      }
    `,
  ],
})
export class DepartmentSalaryComponent {
  private readonly _departments = signal<DepartmentSalary[]>([]);

  @Input({ required: true })
  set departments(value: DepartmentSalary[]) {
    this._departments.set(value);
  }

  departmentsNormalized = computed(() => {
    const departments = this._departments();
    if (departments.length === 0) return [];
    const globalMin = Math.min(...departments.map((d) => d.minSalary));
    const globalMax = Math.max(...departments.map((d) => d.maxSalary));
    const span = globalMax - globalMin || 1;
    return departments.map((d) => ({
      ...d,
      minPercent: ((d.minSalary - globalMin) / span) * 100,
      rangeWidth: ((d.maxSalary - d.minSalary) / span) * 100,
      avgPercent: ((d.avgSalary - globalMin) / span) * 100,
    }));
  });

  formatK = formatK;
}
