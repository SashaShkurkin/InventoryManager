import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInventoryItem,
  DashboardData,
  InventoryItem,
  InventoryListResponse,
  ItemState,
  SearchSuggestion
} from '../models/inventory.models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getAll(params: {
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
  } = {}): Observable<InventoryListResponse> {
    let p = new HttpParams();
    if (params.state)    p = p.set('state', params.state);
    if (params.minPrice != null) p = p.set('minPrice', params.minPrice);
    if (params.maxPrice != null) p = p.set('maxPrice', params.maxPrice);
    if (params.page)     p = p.set('page', params.page);
    if (params.pageSize) p = p.set('pageSize', params.pageSize);
    return this.http.get<InventoryListResponse>(`${this.base}/inventory`, { params: p });
  }

  search(q: string): Observable<SearchSuggestion[]> {
    return this.http.get<SearchSuggestion[]>(`${this.base}/inventory/search`, {
      params: new HttpParams().set('q', q)
    });
  }

  getBySkuake(sku: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.base}/inventory/${sku}`);
  }

  create(item: CreateInventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.base}/inventory`, item);
  }

  update(sku: string, item: CreateInventoryItem): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.base}/inventory/${sku}`, item);
  }

  patchState(sku: string, state: ItemState): Observable<void> {
    return this.http.patch<void>(`${this.base}/inventory/${sku}/state`, { state });
  }

  delete(sku: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/inventory/${sku}`);
  }

  uploadImage(sku: string, file: File): Observable<{ imageUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.base}/inventory/${sku}/image`, form);
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/dashboard`);
  }

  getReport(type: 'all-time' | 'current' | 'revenue'): Observable<Blob> {
    return this.http.get(`${this.base}/reports/${type}`, { responseType: 'blob' });
  }
}
