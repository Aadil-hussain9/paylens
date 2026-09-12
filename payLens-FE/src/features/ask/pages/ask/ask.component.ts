import { Component, signal, inject } from '@angular/core';
import { AssistantService } from '../../services/assistant.service';
import { AssistantResponse } from '../../models/assistant.models';
import { QuestionInputComponent } from '../../components/question-input/question-input.component';
import { ExampleQuestionsComponent } from '../../components/example-questions/example-questions.component';
import { AnswerCardComponent } from '../../components/answer-card/answer-card.component';
import { AnswerContextComponent } from '../../components/answer-context/answer-context.component';
import { AssistantErrorComponent } from '../../components/assistant-error/assistant-error.component';

type AssistantState = 'idle' | 'submitting' | 'success' | 'error' | 'unsupported-question';

@Component({
  selector: 'app-ask',
  imports: [
    QuestionInputComponent,
    ExampleQuestionsComponent,
    AnswerCardComponent,
    AnswerContextComponent,
    AssistantErrorComponent
  ],
  template: `
    <div class="ask-page">
      <div class="ask-header">
        <h1 class="page-title">Ask PayLens</h1>
        <p class="page-subtitle">
          Ask questions about organizational compensation to receive AI-powered, context-aware answers.
        </p>
      </div>

      <div class="ask-content">
        <app-question-input 
          [disabled]="state() === 'submitting'"
          [initialValue]="currentQuestion()"
          (submit)="onQuestionSubmit($event)"
        />

        @if (state() === 'idle') {
          <app-example-questions (select)="onQuestionSubmit($event)" />
        }

        @if (state() === 'submitting') {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Analyzing compensation data...</p>
          </div>
        }

        @if (state() === 'success' && result()) {
          <div class="result-container">
            <app-answer-card 
              [answer]="result()!.answer"
              [relatedAnalyticsLink]="result()!.relatedAnalyticsLink"
            />
            
            @if (result()!.context) {
              <app-answer-context [context]="result()!.context!" />
            }
          </div>
        }

        @if (state() === 'error' || state() === 'unsupported-question') {
          <app-assistant-error 
            [message]="result()?.errorMessage || result()?.answer || 'An unexpected error occurred.'"
            [type]="state() === 'unsupported-question' ? 'unsupported' : 'error'"
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .ask-page {
      max-width: 800px;
      margin: 0 auto;
      padding-top: 24px;
    }
    .ask-header {
      margin-bottom: 32px;
      text-align: center;
    }
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px;
    }
    .page-subtitle {
      font-size: 16px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }
    .ask-content {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 0;
      color: #64748b;
      animation: fadeIn 0.3s;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    .result-container {
      margin-top: 32px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class AskComponent {
  private readonly assistantService = inject(AssistantService);

  state = signal<AssistantState>('idle');
  currentQuestion = signal<string>('');
  result = signal<AssistantResponse | null>(null);

  onQuestionSubmit(question: string) {
    if (!question.trim()) return;

    this.currentQuestion.set(question);
    this.state.set('submitting');
    this.result.set(null);

    this.assistantService.query({ question }).subscribe({
      next: (response) => {
        this.result.set(response);
        if (response.status === 'success') {
          this.state.set('success');
        } else if (response.status === 'unsupported') {
          this.state.set('unsupported-question');
        } else {
          this.state.set('error');
        }
      },
      error: () => {
        this.result.set({
          answer: '',
          status: 'error',
          errorMessage: 'Could not connect to the assistant service.'
        });
        this.state.set('error');
      }
    });
  }
}
