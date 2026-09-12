import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { ShellComponent } from './shared/components/shell/shell.component';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

bootstrapApplication(ShellComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables())
  ],
});
