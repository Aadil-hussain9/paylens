import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EmployeeDetailsComponent } from './employee-details.component';
import { EmployeeService } from '../employee.service/employee.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { EmployeeDetails } from '../models/employee.models';
import { Component, Input, Output, EventEmitter } from '@angular/core';

// Mocks for child components to test in isolation
@Component({ selector: 'app-employee-summary', template: '' })
class MockEmployeeSummaryComponent {
  @Input() employee!: EmployeeDetails;
}

@Component({ selector: 'app-current-salary', template: '' })
class MockCurrentSalaryComponent {
  @Input() salary!: number;
  @Input() currency!: string;
  @Output() editSalary = new EventEmitter<void>();
}

@Component({ selector: 'app-update-salary', template: '' })
class MockUpdateSalaryComponent {
  @Input() employee!: EmployeeDetails;
  @Output() cancel = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();
}

describe('EmployeeDetailsComponent', () => {
  let component: EmployeeDetailsComponent;
  let fixture: ComponentFixture<EmployeeDetailsComponent>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let routeParams$: BehaviorSubject<any>;

  const mockEmployee: EmployeeDetails = {
    id: '1',
    employeeNumber: 'EMP-001',
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'Developer',
    department: 'IT',
    country: 'USA',
    employmentStatus: 'Active',
    currentSalary: 100000,
    currency: 'USD'
  };

  beforeEach(async () => {
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getEmployeeById']);
    routeParams$ = new BehaviorSubject({ get: () => '1' });

    await TestBed.configureTestingModule({
      imports: [EmployeeDetailsComponent],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: ActivatedRoute, useValue: { paramMap: routeParams$ } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should handle loading state and display employee on success', (done) => {
    mockEmployeeService.getEmployeeById.and.returnValue(of(mockEmployee));
    
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.state()).toBe('loaded');
      expect(component.employee()).toEqual(mockEmployee);
      done();
    });
  });

  it('should handle not-found state', (done) => {
    mockEmployeeService.getEmployeeById.and.returnValue(throwError(() => new Error('Employee not found')));
    
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.state()).toBe('not-found');
      expect(component.employee()).toBeNull();
      done();
    });
  });

  it('should handle API error state', (done) => {
    mockEmployeeService.getEmployeeById.and.returnValue(throwError(() => new Error('Server error')));
    
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.state()).toBe('error');
      expect(component.errorMessage()).toBe('Server error');
      done();
    });
  });

  it('should reload employee data when salary is updated successfully', (done) => {
    mockEmployeeService.getEmployeeById.and.returnValue(of(mockEmployee));
    
    fixture.detectChanges();
    
    setTimeout(() => {
      // Simulate updating salary
      component.isEditingSalary.set(true);
      
      // Trigger success callback
      component.onSalaryUpdated();
      
      expect(component.isEditingSalary()).toBeFalse();
      expect(mockEmployeeService.getEmployeeById).toHaveBeenCalledTimes(2); // Initial load + reload
      expect(component.showSuccessNotification()).toBeTrue();
      
      setTimeout(() => {
        expect(component.showSuccessNotification()).toBeFalse();
        done();
      }, 4000);
    });
  });
});
