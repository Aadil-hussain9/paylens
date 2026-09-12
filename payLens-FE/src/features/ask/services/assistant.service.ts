import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssistantQueryRequest, AssistantResponse } from '../models/assistant.models';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly apiUrl = `${environment.apiUrl}/assistant`;

  constructor(private http: HttpClient) {}
  
  query(request: AssistantQueryRequest): Observable<AssistantResponse> {
    return this.http.post<AssistantResponse>(`${this.apiUrl}/query`, request);
  }
}
