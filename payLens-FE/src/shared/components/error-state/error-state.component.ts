import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error-state" role="alert">
      <p class="error-state__icon" aria-hidden="true">!</p>
      <p class="error-state__title">{{ title }}</p>
      <p class="error-state__message">{{ message }}</p>
      @if (showRetry) {
        <button type="button" class="error-state__retry" (click)="retry.emit()">
          Try again
        </button>
      }
    </div>
  `,
  styles: [
    `
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 64px 24px;
        text-align: center;
      }
      .error-state__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #fef2f2;
        color: #dc2626;
        font-size: 18px;
        font-weight: 700;
      }
      .error-state__title {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }
      .error-state__message {
        font-size: 14px;
        color: #64748b;
        max-width: 360px;
      }
      .error-state__retry {
        margin-top: 8px;
        padding: 8px 20px;
        border: 1px solid #0f4c75;
        background: #ffffff;
        color: #0f4c75;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .error-state__retry:hover {
        background: #0f4c75;
        color: #ffffff;
      }
      .error-state__retry:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    `,
  ],
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'An unexpected error occurred while loading data.';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
