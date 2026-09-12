import { Component, input } from '@angular/core';

@Component({
  selector: 'app-assistant-error',
  template: `
    <div class="error-card" [class.unsupported]="type() === 'unsupported'">
      <div class="error-header">
        <span class="icon" aria-hidden="true">{{ type() === 'unsupported' ? '⚠️' : '❌' }}</span>
        <span class="error-title">
          {{ type() === 'unsupported' ? 'Question Not Supported' : 'Something went wrong' }}
        </span>
      </div>
      <p class="error-message">{{ message() }}</p>
    </div>
  `,
  styles: [`
    .error-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      animation: fadeIn 0.3s ease-out;
    }
    .error-card.unsupported {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .error-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .error-title {
      font-weight: 600;
      color: #991b1b;
      font-size: 15px;
    }
    .unsupported .error-title {
      color: #92400e;
    }
    .error-message {
      margin: 0;
      font-size: 14px;
      color: #7f1d1d;
      line-height: 1.5;
    }
    .unsupported .error-message {
      color: #78350f;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AssistantErrorComponent {
  message = input.required<string>();
  type = input<'error' | 'unsupported'>('error');
}
