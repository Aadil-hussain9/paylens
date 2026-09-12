import { Routes } from '@angular/router';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';
import { EmployeeDetailsComponent } from '../employee-details/employee-details.component';

export const EMPLOYEE_ROUTES: Routes = [
  { path: '', component: EmployeeListComponent },
  { path: ':id', component: EmployeeDetailsComponent },
];
