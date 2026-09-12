import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Employee } from '../../models/employee.model';

export type SortColumn = 'name' | 'department' | 'country' | 'salary';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-employee-table',
  imports: [CurrencyPipe],
  template: `
    <div class="table-container">
      <table class="table" aria-label="Employee directory table">
        <thead>
          <tr>
            <th scope="col" class="th-id">ID</th>
            <th scope="col" class="th-sortable" (click)="onSort('name')" aria-sort="none" tabindex="0" (keydown.enter)="onSort('name')">
              Name
              <span class="sort-icon">{{ getSortIcon('name') }}</span>
            </th>
            <th scope="col">Job Title</th>
            <th scope="col" class="th-sortable" (click)="onSort('department')" tabindex="0" (keydown.enter)="onSort('department')">
              Department
              <span class="sort-icon">{{ getSortIcon('department') }}</span>
            </th>
            <th scope="col" class="th-sortable" (click)="onSort('country')" tabindex="0" (keydown.enter)="onSort('country')">
              Country
              <span class="sort-icon">{{ getSortIcon('country') }}</span>
            </th>
            <th scope="col" class="th-sortable th-right" (click)="onSort('salary')" tabindex="0" (keydown.enter)="onSort('salary')">
              Salary
              <span class="sort-icon">{{ getSortIcon('salary') }}</span>
            </th>
            <th scope="col" class="th-center">Status</th>
          </tr>
        </thead>
        <tbody>
          @for (emp of employees(); track emp.id) {
            <tr class="table-row" (click)="onRowClick(emp)" tabindex="0" (keydown.enter)="onRowClick(emp)">
              <td class="td-id">{{ emp.id }}</td>
              <td class="td-name">{{ emp.name }}</td>
              <td class="td-secondary">{{ emp.jobTitle }}</td>
              <td>{{ emp.department }}</td>
              <td>{{ emp.country }}</td>
              <td class="td-right td-salary">{{ emp.salary | currency:emp.currency:'symbol':'1.0-0' }}</td>
              <td class="td-center">
                <span class="status-badge" [class]="'status-' + emp.employmentStatus.toLowerCase().replace(' ', '-')">
                  {{ emp.employmentStatus }}
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 24px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    td {
      padding: 14px 16px;
      font-size: 14px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-row {
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .table-row:hover, .table-row:focus-within {
      background-color: #f1f5f9;
      outline: none;
    }
    .th-sortable {
      cursor: pointer;
      user-select: none;
    }
    .th-sortable:hover, .th-sortable:focus {
      color: #0f172a;
      background-color: #f1f5f9;
      outline: none;
    }
    .sort-icon {
      display: inline-block;
      width: 14px;
      margin-left: 4px;
      color: #94a3b8;
    }
    .th-right, .td-right {
      text-align: right;
    }
    .th-center, .td-center {
      text-align: center;
    }
    .td-id {
      font-family: monospace;
      font-size: 13px;
      color: #64748b;
    }
    .td-name {
      font-weight: 600;
      color: #0f172a;
    }
    .td-secondary {
      color: #64748b;
    }
    .td-salary {
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
    }
    .status-active {
      background-color: #dcfce7;
      color: #166534;
    }
    .status-on-leave {
      background-color: #fef08a;
      color: #854d0e;
    }
    .status-terminated {
      background-color: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class EmployeeTableComponent {
  employees = input.required<Employee[]>();
  currentSort = input<SortColumn | undefined>();
  currentDirection = input<SortDirection | undefined>();

  sortChanged = output<{ column: SortColumn; direction: SortDirection }>();
  employeeClicked = output<Employee>();

  onSort(column: SortColumn): void {
    let direction: SortDirection = 'asc';
    if (this.currentSort() === column && this.currentDirection() === 'asc') {
      direction = 'desc';
    }
    this.sortChanged.emit({ column, direction });
  }

  getSortIcon(column: SortColumn): string {
    if (this.currentSort() !== column) {
      return '↕';
    }
    return this.currentDirection() === 'asc' ? '↑' : '↓';
  }

  onRowClick(emp: Employee): void {
    this.employeeClicked.emit(emp);
  }
}
