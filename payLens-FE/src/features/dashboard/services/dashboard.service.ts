import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DashboardData } from '../models/dashboard.model';
import { MOCK_DASHBOARD_DATA } from '../data/mock-dashboard-data';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly mockDelay = 600;

  getDashboardData(): Observable<DashboardData> {
    return of(MOCK_DASHBOARD_DATA).pipe(delay(this.mockDelay));
  }
}
