import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsComponent } from './analytics.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AnalyticsComponent', () => {
  let component: AnalyticsComponent;
  let fixture: ComponentFixture<AnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and have default empty filters', () => {
    expect(component).toBeTruthy();
    expect(component.activeFilters()).toEqual({});
  });

  it('should update activeFilters when child emits', () => {
    component.onFiltersChanged({ country: 'India', department: 'Engineering' });
    
    expect(component.activeFilters()).toEqual({ 
      country: 'India', 
      department: 'Engineering' 
    });
  });
});
