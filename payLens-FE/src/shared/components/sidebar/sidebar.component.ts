import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="app-sidebar" aria-label="Main navigation">
      <ul class="app-sidebar__list" role="list">
        @for (item of navItems; track item.path) {
          <li class="app-sidebar__item">
            <a
              [routerLink]="item.path"
              routerLinkActive="app-sidebar__link--active"
              [routerLinkActiveOptions]="{ exact: item.path === '/employees' }"
              class="app-sidebar__link"
              [attr.aria-current]="undefined"
            >
              <span class="app-sidebar__icon" [innerHTML]="item.icon" aria-hidden="true"></span>
              <span class="app-sidebar__label">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: [
    `
      .app-sidebar {
        width: 220px;
        height: 100%;
        background: #0f172a;
        padding: 16px 0;
        overflow-y: auto;
        flex-shrink: 0;
      }
      .app-sidebar__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .app-sidebar__link {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 20px;
        font-size: 14px;
        color: #94a3b8;
        text-decoration: none;
        font-weight: 500;
        transition: background 0.15s ease, color 0.15s ease;
        border-left: 3px solid transparent;
      }
      .app-sidebar__link:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
      }
      .app-sidebar__link:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: -2px;
      }
      .app-sidebar__link--active {
        background: rgba(15, 76, 117, 0.3);
        color: #ffffff;
        border-left-color: #3282b8;
      }
      .app-sidebar__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
      }
      .app-sidebar__icon ::ng-deep svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    `,
  ],
})
export class SidebarComponent {
  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    },
    {
      label: 'Compensation',
      path: '/compensation',
      icon: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    },
    {
      label: 'Ask PayLens',
      path: '/ask',
      icon: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M12 7v.01"></path><path d="M12 11v4"></path></svg>',
    },
  ];
}
