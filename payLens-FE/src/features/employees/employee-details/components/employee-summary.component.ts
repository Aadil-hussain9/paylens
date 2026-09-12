import { Component, input } from '@angular/core';
import { EmployeeDetails } from '../../models/employee.models';

@Component({
  selector: 'app-employee-summary',
  template: `
    <div class="summary-card">
      <div class="summary-header">
        <div class="avatar" aria-hidden="true">
          {{ employee().firstName[0] }}{{ employee().lastName[0] }}
        </div>
        <div class="name-container">
          <h2 class="name">{{ employee().firstName }} {{ employee().lastName }}</h2>
          <span class="employee-id">{{ employee().employeeNumber }}</span>
        </div>
      </div>
      
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">Job Title</span>
          <span class="value">{{ employee().jobTitle }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Department</span>
          <span class="value">{{ employee().department }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Country</span>
          <span class="value">{{ employee().country }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Status</span>
          <span class="status-badge" [class.active]="employee().employmentStatus === 'Active'">
            {{ employee().employmentStatus }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }
    .summary-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: #f0f9ff;
      color: #0284c7;
      font-size: 20px;
      font-weight: 700;
      border-radius: 50%;
    }
    .name {
      margin: 0 0 4px;
      font-size: 22px;
      color: #0f172a;
    }
    .employee-id {
      font-size: 14px;
      color: #64748b;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .label {
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 500;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      width: fit-content;
    }
    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }
  `]
})
export class EmployeeSummaryComponent {
  employee = input.required<EmployeeDetails>();
}
