import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  template: `
    <header class="app-header">
      <div class="app-header__brand">
        <span class="app-header__logo" aria-hidden="true">PL</span>
        <span class="app-header__title">PayLens</span>
      </div>
      <div class="app-header__center">
        <span class="app-header__context">{{ pageTitle() }}</span>
      </div>
      <div class="app-header__actions">
        <div class="app-header__profile">
          <span class="app-header__avatar" aria-hidden="true">AM</span>
          <div class="app-header__profile-info">
            <span class="app-header__profile-name">Alex Morgan</span>
            <span class="app-header__profile-role">HR Manager</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 60px;
        padding: 0 24px;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        flex-shrink: 0;
      }
      .app-header__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 220px;
      }
      .app-header__logo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 7px;
        background: #0f4c75;
        color: #fff;
        font-weight: 700;
        font-size: 12px;
      }
      .app-header__title {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }
      .app-header__center {
        flex: 1;
        text-align: center;
      }
      .app-header__context {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
      }
      .app-header__actions {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 220px;
        justify-content: flex-end;
      }
      .app-header__profile {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .app-header__avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #e0f2fe;
        color: #0f4c75;
        font-weight: 700;
        font-size: 12px;
      }
      .app-header__profile-info {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .app-header__profile-name {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .app-header__profile-role {
        font-size: 11px;
        color: #94a3b8;
      }
      @media (max-width: 768px) {
        .app-header__center {
          display: none;
        }
        .app-header__profile-info {
          display: none;
        }
        .app-header__brand,
        .app-header__actions {
          width: auto;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  private readonly router = inject(Router);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.routeToTitle(this.router.url)),
      startWith(this.routeToTitle(this.router.url)),
    ),
    { initialValue: this.routeToTitle(this.router.url) },
  );

  private routeToTitle(url: string): string {
    if (url.startsWith('/dashboard')) return 'Dashboard';
    if (url.startsWith('/employees')) return 'Employees';
    if (url.startsWith('/compensation')) return 'Compensation';
    if (url.startsWith('/analytics')) return 'Analytics';
    return 'Dashboard';
  }
}
