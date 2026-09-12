import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UpdateSalaryComponent } from './update-salary.component';
import { CompensationService } from '../compensation.service/compensation.service';
import { of, throwError } from 'rxjs';
import { EmployeeDetails } from '../../employees/models/employee.models';

describe('UpdateSalaryComponent', () => {
  let component: UpdateSalaryComponent;
  let fixture: ComponentFixture<UpdateSalaryComponent>;
  let mockCompensationService: jasmine.SpyObj<CompensationService>;

  const mockEmployee: EmployeeDetails = {
    id: '1',
    employeeNumber: 'EMP-001',
    firstName: 'Jane',
    lastName: 'Doe',
    jobTitle: 'Developer',
    department: 'IT',
    country: 'USA',
    employmentStatus: 'Active',
    currentSalary: 100000,
    currency: 'USD'
  };

  beforeEach(async () => {
    mockCompensationService = jasmine.createSpyObj('CompensationService', ['updateSalary']);

    await TestBed.configureTestingModule({
      imports: [UpdateSalaryComponent],
      providers: [
        { provide: CompensationService, useValue: mockCompensationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateSalaryComponent);
    fixture.componentRef.setInput('employee', mockEmployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize the form with employee currency', () => {
    expect(component.form.get('currency')?.value).toBe('USD');
    expect(component.state()).toBe('editing');
  });

  it('should require newSalary and reason', () => {
    expect(component.form.valid).toBeFalse();
    
    component.form.patchValue({ newSalary: 120000 });
    expect(component.form.valid).toBeFalse();
    
    component.form.patchValue({ reason: 'Promotion' });
    expect(component.form.valid).toBeTrue();
  });

  it('should calculate change amount and percentage correctly', () => {
    component.form.patchValue({ newSalary: 110000 });
    
    expect(component.changeAmount()).toBe(10000);
    expect(component.changePercentage()).toBe(10); // 10%
  });

  it('should transition to preview state when form is valid', () => {
    component.form.patchValue({ newSalary: 120000, reason: 'Annual Review' });
    
    component.onPreview();
    
    expect(component.state()).toBe('previewing');
  });

  it('should transition to submitting state and call API on submit', (done) => {
    mockCompensationService.updateSalary.and.returnValue(of(void 0));
    component.form.patchValue({ newSalary: 120000, reason: 'Annual Review' });
    
    spyOn(component.success, 'emit');
    
    component.onPreview(); // Go to preview
    component.onSubmit(); // Confirm
    
    expect(component.state()).toBe('submitting');
    expect(mockCompensationService.updateSalary).toHaveBeenCalledWith('1', {
      newSalary: 120000,
      currency: 'USD',
      reason: 'Annual Review'
    });
    
    setTimeout(() => {
      expect(component.success.emit).toHaveBeenCalled();
      done();
    });
  });

  it('should revert to preview state and show error if API fails', (done) => {
    mockCompensationService.updateSalary.and.returnValue(throwError(() => new Error('Concurrency error')));
    component.form.patchValue({ newSalary: 120000, reason: 'Annual Review' });
    
    component.onPreview();
    component.onSubmit();
    
    setTimeout(() => {
      expect(component.state()).toBe('previewing');
      expect(component.apiError()).toBe('Concurrency error');
      done();
    });
  });
});
