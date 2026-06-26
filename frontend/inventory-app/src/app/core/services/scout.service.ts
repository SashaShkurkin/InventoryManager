import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScoutDto, ScoutDashboardDto, CreateScoutDto } from '../models/scout.models';

@Injectable({ providedIn: 'root' })
export class ScoutService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<ScoutDto[]> {
    return this.http.get<ScoutDto[]>('/api/scout');
  }

  getById(id: number): Observable<ScoutDto> {
    return this.http.get<ScoutDto>(`/api/scout/${id}`);
  }

  getDashboard(id: number): Observable<ScoutDashboardDto> {
    return this.http.get<ScoutDashboardDto>(`/api/scout/${id}/dashboard`);
  }

  getMyDashboard(): Observable<ScoutDashboardDto> {
    return this.http.get<ScoutDashboardDto>('/api/scout/dashboard');
  }

  create(dto: CreateScoutDto): Observable<ScoutDto> {
    return this.http.post<ScoutDto>('/api/scout', dto);
  }

  update(id: number, dto: CreateScoutDto): Observable<ScoutDto> {
    return this.http.put<ScoutDto>(`/api/scout/${id}`, dto);
  }
}
