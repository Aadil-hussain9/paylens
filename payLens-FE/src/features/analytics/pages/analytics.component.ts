import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  template: `
    <div class="page">
      <h1 class="page__title">Compensation Analytics</h1>
      <p class="page__placeholder">
        Analytics dashboards — salary distribution, department comparisons, and trend charts will appear here.
      </p>
    </div>
  `,
  styles: [
    `
      .page { max-width: 1200px; }
      .page__title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
      .page__placeholder { font-size: 15px; color: #64748b; line-height: 1.5; }
    `,
  ],
})
export class AnalyticsComponent {}
