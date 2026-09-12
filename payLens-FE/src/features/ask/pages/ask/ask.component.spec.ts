import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AskComponent } from './ask.component';
import { AssistantService } from '../../services/assistant.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

describe('AskComponent', () => {
  let component: AskComponent;
  let fixture: ComponentFixture<AskComponent>;
  let mockAssistantService: any;

  beforeEach(async () => {
    mockAssistantService = {
      query: jasmine.createSpy('query').and.returnValue(of({
        answer: 'Test answer',
        status: 'success'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [AskComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AssistantService, useValue: mockAssistantService }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with idle state', () => {
    expect(component.state()).toBe('idle');
  });

  it('should set submitting state and call service on question submit', () => {
    const question = 'What is the average salary?';
    
    component.onQuestionSubmit(question);
    
    expect(component.currentQuestion()).toBe(question);
    expect(mockAssistantService.query).toHaveBeenCalledWith({ question });
    
    // Service returns immediately in test because we didn't add delay to spy
    expect(component.state()).toBe('success');
    expect(component.result()?.answer).toBe('Test answer');
  });

  it('should handle unsupported questions', () => {
    mockAssistantService.query.and.returnValue(of({
      answer: 'Not supported',
      status: 'unsupported'
    }));

    component.onQuestionSubmit('Delete all employees');
    
    expect(component.state()).toBe('unsupported-question');
    expect(component.result()?.answer).toBe('Not supported');
  });

  it('should handle service errors gracefully', () => {
    mockAssistantService.query.and.returnValue(throwError(() => new Error('Network error')));

    component.onQuestionSubmit('What is the total payroll?');
    
    expect(component.state()).toBe('error');
    expect(component.result()?.errorMessage).toBe('Could not connect to the assistant service.');
  });
});
