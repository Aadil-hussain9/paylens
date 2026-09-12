import { Component, input } from '@angular/core';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-summary',
  template: `
    <div class="summary-card">
      <div class="summary-header">
        <div class="avatar">
          {{ getInitials(employee().name) }}
        </div>
        <div class="header-details">
          <h2>{{ employee().name }}</h2>
          <span class="id-badge">{{ employee().id }}</span>
        </div>
      </div>
      
      <div class="summary-body">
        <div class="info-group">
          <label>Job Title</label>
          <div class="val">{{ employee().jobTitle }}</div>
        </div>
        <div class="info-group">
          <label>Department</label>
          <div class="val">{{ employee().department }}</div>
        </div>
        <div class="info-group">
          <label>Country</label>
          <div class="val">{{ employee().country }}</div>
        </div>
        <div class="info-group">
          <label>Status</label>
          <div class="val">
            <span class="status-badge" [class]="'status-' + employee().employmentStatus.toLowerCase().replace(' ', '-')">
              {{ employee().employmentStatus }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .summary-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
    }
    .header-details h2 {
      margin: 0 0 4px;
      font-size: 22px;
      color: #0f172a;
    }
    .id-badge {
      font-family: monospace;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    .summary-body {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .info-group label {
      display: block;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .val {
      font-size: 15px;
      color: #1e293b;
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
export class EmployeeSummaryComponent {
  employee = input.required<Employee>();

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
