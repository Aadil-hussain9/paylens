import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AssistantQueryRequest, AssistantResponse } from '../models/assistant.models';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  
  query(request: AssistantQueryRequest): Observable<AssistantResponse> {
    const q = request.question.toLowerCase().trim();
    
    // Simulate generic server error (for "crash" test keyword)
    if (q.includes('crash')) {
      return of({
        answer: '',
        status: 'error' as const,
        errorMessage: 'The AI service is currently unavailable. Please try again later.'
      }).pipe(delay(800));
    }

    // Pattern matching for mock intent resolution
    if (q.includes('delete') || q.includes('drop') || q.includes('update')) {
      return of({
        answer: 'I support compensation analysis, not destructive operations. I cannot modify or delete employee data.',
        status: 'unsupported' as const
      }).pipe(delay(1000));
    }

    if (q.includes('average') && q.includes('engineering') && q.includes('india')) {
      return of({
        answer: 'The average Engineering salary in India is ₹28,400,000.',
        status: 'success' as const,
        context: {
          employeesAnalyzed: 1248,
          department: 'Engineering',
          country: 'India',
          metric: 'Average current salary',
          reportingCurrency: 'INR',
          timestamp: new Date().toISOString()
        },
        relatedAnalyticsLink: '/analytics?department=Engineering&country=India'
      }).pipe(delay(1200));
    }

    if (q.includes('highest payroll')) {
      return of({
        answer: 'Engineering has the highest total payroll across the organization.',
        status: 'success' as const,
        context: {
          employeesAnalyzed: 10000,
          metric: 'Total Payroll by Department',
          reportingCurrency: 'USD',
          timestamp: new Date().toISOString()
        },
        relatedAnalyticsLink: '/analytics'
      }).pipe(delay(1100));
    }

    if (q.includes('outlier')) {
      return of({
        answer: 'There are 14 potential salary outliers identified in Engineering, earning significantly above the 75th percentile.',
        status: 'success' as const,
        context: {
          employeesAnalyzed: 2300,
          department: 'Engineering',
          metric: 'Salary Outliers (>75th percentile)',
          reportingCurrency: 'USD',
          timestamp: new Date().toISOString()
        }
      }).pipe(delay(1500));
    }

    // Default catch-all for successful unsupported-but-safe or generic questions
    return of({
      answer: 'I can help you understand salary distributions, averages, and outliers. Could you please rephrase your question to be more specific about a department or country?',
      status: 'unsupported' as const
    }).pipe(delay(900));
  }
}
