import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="loading-state" role="status" aria-live="polite">
      <span class="loading-state__spinner" aria-hidden="true"></span>
      <p class="loading-state__text">{{ message }}</p>
    </div>
  `,
  styles: [
    `
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 64px 24px;
      }
      .loading-state__spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #0f4c75;
        border-radius: 50%;
        animation: loading-spin 0.7s linear infinite;
      }
      .loading-state__text {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }
      @keyframes loading-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
}
