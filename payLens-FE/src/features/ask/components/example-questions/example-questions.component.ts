import { Component, output } from '@angular/core';

@Component({
  selector: 'app-example-questions',
  template: `
    <div class="examples-container">
      <p class="examples-title">Try asking:</p>
      <div class="examples-grid">
        @for (q of questions; track q) {
          <button class="example-btn" (click)="select.emit(q)">
            <span class="icon" aria-hidden="true">💡</span>
            {{ q }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .examples-container {
      margin-bottom: 32px;
    }
    .examples-title {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    .examples-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .example-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 14px;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }
    .example-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    .icon {
      font-size: 16px;
    }
  `]
})
export class ExampleQuestionsComponent {
  select = output<string>();

  questions = [
    "What is the average engineering salary in India?",
    "Which department has the highest payroll?",
    "Are there any salary outliers in Sales?",
    "What is the median salary in Finance?",
    "How many employees are in Operations?",
    "What is the total payroll for HR in Canada?"
  ];
}
