import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UpdateSalaryModalComponent } from './update-salary-modal.component';
import { CompensationService } from '../../services/compensation.service';
import { of, throwError } from 'rxjs';

describe('UpdateSalaryModalComponent', () => {
  let component: UpdateSalaryModalComponent;
  let fixture: ComponentFixture<UpdateSalaryModalComponent>;
  let mockCompensationService: any;

  beforeEach(async () => {
    mockCompensationService = {
      updateSalary: jasmine.createSpy('updateSalary').and.returnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [UpdateSalaryModalComponent],
      providers: [
        { provide: CompensationService, useValue: mockCompensationService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateSalaryModalComponent);
    component = fixture.componentInstance;
    
    fixture.componentRef.setInput('employeeId', 'EMP-1');
    fixture.componentRef.setInput('currentSalary', 100000);
    fixture.componentRef.setInput('currency', 'USD');
    
    fixture.detectChanges();
  });

  it('should start in editing state', () => {
    expect(component.state()).toBe('editing');
  });

  it('should transition to reviewing state on valid form submission', () => {
    component.onReview({
      newSalary: 110000,
      effectiveDate: '2026-01-01',
      reason: 'Promotion',
      comment: ''
    });
    
    expect(component.state()).toBe('reviewing');
    expect(component.draftValue()?.newSalary).toBe(110000);
  });

  it('should call compensation service and emit success on confirm', () => {
    spyOn(component.success, 'emit');
    
    component.onReview({
      newSalary: 110000,
      effectiveDate: '2026-01-01',
      reason: 'Promotion',
      comment: ''
    });
    
    component.onConfirm();
    
    expect(component.state()).toBe('submitting');
    expect(mockCompensationService.updateSalary).toHaveBeenCalledWith({
      employeeId: 'EMP-1',
      currentSalaryBase: 100000,
      newSalary: 110000,
      currency: 'USD',
      effectiveDate: '2026-01-01',
      reason: 'Promotion',
      comment: ''
    });
    
    expect(component.success.emit).toHaveBeenCalled();
  });

  it('should handle concurrency conflict error gracefully', () => {
    mockCompensationService.updateSalary.and.returnValue(throwError(() => new Error('CONCURRENCY_CONFLICT')));
    
    component.onReview({
      newSalary: 110000,
      effectiveDate: '2026-01-01',
      reason: 'Promotion',
      comment: ''
    });
    
    component.onConfirm();
    
    // Should fall back to reviewing state
    expect(component.state()).toBe('reviewing');
    // Should display appropriate error message
    expect(component.errorMessage()).toContain('updated by another user');
  });
});
