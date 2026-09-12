import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AnalyticsFiltersComponent } from './analytics-filters.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('AnalyticsFiltersComponent', () => {
  let component: AnalyticsFiltersComponent;
  let fixture: ComponentFixture<AnalyticsFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsFiltersComponent, ReactiveFormsModule]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AnalyticsFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit debounced filter changes', (done) => {
    spyOn(component.filtersChanged, 'emit');
    
    component.filterForm.patchValue({ country: 'United States' });
    
    expect(component.filtersChanged.emit).not.toHaveBeenCalled();
    
    setTimeout(() => {
      expect(component.filtersChanged.emit).toHaveBeenCalledWith({ country: 'United States' });
      done();
    }, 350);
  });

  it('should clear filters when clear button is clicked', (done) => {
    spyOn(component.filtersChanged, 'emit');
    
    component.filterForm.patchValue({ country: 'United States', department: 'Engineering' });
    
    setTimeout(() => {
      expect(component.isFiltered()).toBeTrue();
      
      component.clearFilters();
      
      setTimeout(() => {
        expect(component.filterForm.value).toEqual({
          country: '',
          department: '',
          employmentStatus: ''
        });
        expect(component.filtersChanged.emit).toHaveBeenCalledWith({});
        done();
      }, 350);
    }, 350);
  });
});
