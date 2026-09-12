import { Component, input } from '@angular/core';
import { AssistantContext } from '../../models/assistant.models';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-answer-context',
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="context-container">
      <div class="context-header">
        <span class="icon" aria-hidden="true">📊</span>
        <h4>Supporting Data Context</h4>
      </div>
      <div class="context-grid">
        <div class="context-item">
          <span class="context-label">Metric</span>
          <span class="context-value">{{ context().metric }}</span>
        </div>
        <div class="context-item">
          <span class="context-label">Employees Analyzed</span>
          <span class="context-value">{{ context().employeesAnalyzed | number }}</span>
        </div>
        <div class="context-item">
          <span class="context-label">Reporting Currency</span>
          <span class="context-value">{{ context().reportingCurrency }}</span>
        </div>
        @if (context().department) {
          <div class="context-item">
            <span class="context-label">Department</span>
            <span class="context-value">{{ context().department }}</span>
          </div>
        }
        @if (context().country) {
          <div class="context-item">
            <span class="context-label">Country</span>
            <span class="context-value">{{ context().country }}</span>
          </div>
        }
        <div class="context-item">
          <span class="context-label">Data Timestamp</span>
          <span class="context-value">{{ context().timestamp | date:'short' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .context-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
      animation: fadeIn 0.4s ease-out;
    }
    .context-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .context-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }
    .context-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .context-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .context-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .context-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 500;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AnswerContextComponent {
  context = input.required<AssistantContext>();
}
