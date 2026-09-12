import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalaryChangePreviewComponent } from './salary-change-preview.component';

describe('SalaryChangePreviewComponent', () => {
  let component: SalaryChangePreviewComponent;
  let fixture: ComponentFixture<SalaryChangePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryChangePreviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalaryChangePreviewComponent);
    component = fixture.componentInstance;
    
    fixture.componentRef.setInput('currentSalary', 100000);
    fixture.componentRef.setInput('currency', 'USD');
    fixture.componentRef.setInput('formValue', {
      newSalary: 110000,
      effectiveDate: '2026-01-01',
      reason: 'Promotion',
      comment: ''
    });
    
    fixture.detectChanges();
  });

  it('should correctly calculate change amount and percentage', () => {
    expect(component.getChangeAmount()).toBe(10000);
    expect(component.getChangePercentage()).toBe(0.1); // 10%
  });
  
  it('should handle negative changes', () => {
    fixture.componentRef.setInput('formValue', {
      newSalary: 90000,
      effectiveDate: '2026-01-01',
      reason: 'Correction',
      comment: ''
    });
    
    expect(component.getChangeAmount()).toBe(-10000);
    expect(component.getChangePercentage()).toBe(-0.1); // -10%
  });
});
