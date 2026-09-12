import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-answer-card',
  imports: [RouterLink],
  template: `
    <div class="answer-card">
      <div class="answer-header">
        <div class="ai-avatar">PL</div>
        <span class="ai-name">PayLens Assistant</span>
      </div>
      <div class="answer-body">
        <p class="answer-text">{{ answer() }}</p>
      </div>
      @if (relatedAnalyticsLink()) {
        <div class="answer-actions">
          <a [routerLink]="relatedAnalyticsLink()" class="action-link">
            View Analytics <span aria-hidden="true">→</span>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .answer-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
      animation: fadeIn 0.3s ease-out;
    }
    .answer-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .ai-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #0f4c75;
      color: white;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
    }
    .ai-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 15px;
    }
    .answer-text {
      font-size: 16px;
      line-height: 1.6;
      color: #334155;
      margin: 0;
    }
    .answer-actions {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    .action-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: color 0.2s;
    }
    .action-link:hover {
      color: #2563eb;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AnswerCardComponent {
  answer = input.required<string>();
  relatedAnalyticsLink = input<string | undefined>();
}
