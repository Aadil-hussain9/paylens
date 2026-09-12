import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalaryUpdateFormComponent } from './salary-update-form.component';

describe('SalaryUpdateFormComponent', () => {
  let component: SalaryUpdateFormComponent;
  let fixture: ComponentFixture<SalaryUpdateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryUpdateFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalaryUpdateFormComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('currentSalary', 100000);
    fixture.componentRef.setInput('currency', 'USD');
    
    fixture.detectChanges();
  });

  it('should create the form with required validation rules', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('newSalary')?.hasError('required')).toBeTrue();
    expect(component.form.valid).toBeFalse();
  });

  it('should reject invalid salary values', () => {
    const newSalaryControl = component.form.get('newSalary');
    
    // 0 is invalid
    newSalaryControl?.setValue(0);
    expect(newSalaryControl?.hasError('min')).toBeTrue();
    
    // negative is invalid
    newSalaryControl?.setValue(-5000);
    expect(newSalaryControl?.hasError('min')).toBeTrue();
    
    // positive is valid
    newSalaryControl?.setValue(120000);
    expect(newSalaryControl?.errors).toBeNull();
  });

  it('should prevent submission if form is invalid', () => {
    spyOn(component.review, 'emit');
    
    // Form is empty and invalid
    component.onSubmit();
    
    expect(component.review.emit).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue(); // Should mark fields touched to show errors
  });

  it('should emit review event when form is valid and submitted', () => {
    spyOn(component.review, 'emit');
    
    component.form.patchValue({
      newSalary: 120000,
      effectiveDate: '2026-10-01',
      reason: 'Promotion',
      comment: 'Great job'
    });
    
    component.onSubmit();
    
    expect(component.review.emit).toHaveBeenCalledWith({
      newSalary: 120000,
      effectiveDate: '2026-10-01',
      reason: 'Promotion',
      comment: 'Great job'
    });
  });
});
