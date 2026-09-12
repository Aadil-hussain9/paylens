import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-header />
      <div class="app-shell__body">
        <app-sidebar />
        <main class="app-shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-shell {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }
      .app-shell__body {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .app-shell__content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: var(--color-bg, #f8fafc);
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class ShellComponent {}
