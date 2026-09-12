import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state" role="status">
      <p class="empty-state__icon" aria-hidden="true">{{ icon }}</p>
      <p class="empty-state__title">{{ title }}</p>
      <p class="empty-state__message">{{ message }}</p>
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 64px 24px;
        text-align: center;
      }
      .empty-state__icon {
        font-size: 32px;
        color: #cbd5e1;
      }
      .empty-state__title {
        font-size: 16px;
        font-weight: 600;
        color: #475569;
      }
      .empty-state__message {
        font-size: 14px;
        color: #94a3b8;
        max-width: 360px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = '—';
  @Input({ required: true }) title!: string;
  @Input() message = '';
}
