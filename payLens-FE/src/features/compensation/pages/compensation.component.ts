import { Component } from '@angular/core';

@Component({
  selector: 'app-compensation',
  template: `
    <div class="page">
      <h1 class="page__title">Compensation</h1>
      <p class="page__placeholder">
        Salary management — adjust base pay, bonuses, and review pending salary changes will appear here.
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
export class CompensationComponent {}
