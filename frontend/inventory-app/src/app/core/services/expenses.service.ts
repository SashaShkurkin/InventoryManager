import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateExpense, Expense, ExpenseListResponse } from '../models/inventory.models';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getAll(page = 0, pageSize = 50): Observable<ExpenseListResponse> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ExpenseListResponse>(`${this.base}/expenses`, { params });
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.base}/expenses/${id}`);
  }

  create(expense: CreateExpense): Observable<Expense> {
    return this.http.post<Expense>(`${this.base}/expenses`, expense);
  }

  update(id: number, expense: CreateExpense): Observable<Expense> {
    return this.http.put<Expense>(`${this.base}/expenses/${id}`, expense);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/expenses/${id}`);
  }

  uploadReceipt(id: number, file: File): Observable<void> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<void>(`${this.base}/expenses/${id}/receipt`, form);
  }

  receiptUrl(id: number): string {
    return `${this.base}/expenses/${id}/receipt`;
  }
}
