import { Component, output, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-question-input',
  imports: [ReactiveFormsModule],
  template: `
    <div class="input-container">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="question-form">
        <div class="input-wrapper">
          <input 
            type="text" 
            formControlName="question" 
            class="question-input"
            placeholder="Ask a question about your organization's compensation..."
            [attr.disabled]="disabled() ? true : null"
            autocomplete="off"
          >
          <button 
            type="submit" 
            class="submit-btn" 
            [disabled]="form.invalid || disabled()"
            aria-label="Submit question"
          >
            <span class="icon" aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .input-container {
      width: 100%;
      margin-bottom: 24px;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 24px;
      padding: 4px 4px 4px 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-wrapper:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    .question-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      color: #0f172a;
      background: transparent;
      padding: 10px 0;
    }
    .question-input::placeholder {
      color: #94a3b8;
    }
    .question-input:disabled {
      color: #94a3b8;
    }
    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .submit-btn:hover:not(:disabled) {
      background: #2563eb;
    }
    .submit-btn:active:not(:disabled) {
      transform: scale(0.95);
    }
    .submit-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }
    .icon {
      font-size: 18px;
      font-weight: bold;
    }
  `]
})
export class QuestionInputComponent implements OnInit {
  disabled = input<boolean>(false);
  initialValue = input<string>('');
  
  submit = output<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      question: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (this.initialValue()) {
      this.form.patchValue({ question: this.initialValue() });
    }
  }

  onSubmit() {
    if (this.form.valid && !this.disabled()) {
      this.submit.emit(this.form.value.question);
    }
  }
}
