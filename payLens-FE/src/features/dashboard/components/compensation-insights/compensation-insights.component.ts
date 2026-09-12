import { Component, Input, signal } from '@angular/core';
import {
  CompensationInsight,
  InsightSeverity,
} from '../../models/dashboard.model';

const severityClassMap: Record<InsightSeverity, string> = {
  high: 'insight--high',
  medium: 'insight--medium',
  low: 'insight--low',
};

const severityLabelMap: Record<InsightSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const categoryLabelMap: Record<CompensationInsight['category'], string> = {
  outlier: 'Outlier',
  variation: 'Variation',
  geography: 'Geography',
};

@Component({
  selector: 'app-compensation-insights',
  template: `
    <section class="insights" aria-label="Compensation insights">
      <h2 class="insights__title">Compensation Insights</h2>
      <p class="insights__subtitle">
        Flagged observations requiring HR attention
      </p>
      <ul class="insights__list">
        @for (insight of _insights(); track insight.id) {
          <li class="insight" [class]="severityClass(insight.severity)">
            <div class="insight__header">
              <span class="insight__category">{{ categoryLabel(insight.category) }}</span>
              <span class="insight__severity">
                <span class="insight__severity-dot" aria-hidden="true"></span>
                {{ severityLabel(insight.severity) }}
              </span>
            </div>
            <h3 class="insight__title">{{ insight.title }}</h3>
            <p class="insight__description">{{ insight.description }}</p>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .insights {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 24px;
      }
      .insights__title {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }
      .insights__subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 20px;
      }
      .insights__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .insight {
        border: 1px solid #e2e8f0;
        border-left: 4px solid #cbd5e1;
        border-radius: 8px;
        padding: 16px 20px;
      }
      .insight--high {
        border-left-color: #dc2626;
      }
      .insight--medium {
        border-left-color: #f59e0b;
      }
      .insight--low {
        border-left-color: #3282b8;
      }
      .insight__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .insight__category {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .insight__severity {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
      }
      .insight__severity-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #cbd5e1;
      }
      .insight--high .insight__severity-dot {
        background: #dc2626;
      }
      .insight--medium .insight__severity-dot {
        background: #f59e0b;
      }
      .insight--low .insight__severity-dot {
        background: #3282b8;
      }
      .insight__title {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 4px;
      }
      .insight__description {
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
        margin: 0;
      }
    `,
  ],
})
export class CompensationInsightsComponent {
  protected readonly _insights = signal<CompensationInsight[]>([]);

  @Input({ required: true })
  set insights(value: CompensationInsight[]) {
    this._insights.set(value);
  }

  severityClass = (s: InsightSeverity) => severityClassMap[s];
  severityLabel = (s: InsightSeverity) => severityLabelMap[s];
  categoryLabel = (c: CompensationInsight['category']) => categoryLabelMap[c];
}
