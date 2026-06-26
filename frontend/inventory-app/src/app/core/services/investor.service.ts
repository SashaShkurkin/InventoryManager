import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvestorDto, InvestorDashboardDto, CreateInvestorDto, InvestorPaymentDto, CreateInvestorPaymentDto } from '../models/investor.models';

@Injectable({ providedIn: 'root' })
export class InvestorService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<InvestorDto[]> {
    return this.http.get<InvestorDto[]>('/api/investor');
  }

  getById(id: number): Observable<InvestorDto> {
    return this.http.get<InvestorDto>(`/api/investor/${id}`);
  }

  getDashboard(id: number): Observable<InvestorDashboardDto> {
    return this.http.get<InvestorDashboardDto>(`/api/investor/${id}/dashboard`);
  }

  /** Investor's own dashboard — reads investor_id from JWT on the server. */
  getMyDashboard(): Observable<InvestorDashboardDto> {
    return this.http.get<InvestorDashboardDto>('/api/investor/dashboard');
  }

  create(dto: CreateInvestorDto): Observable<InvestorDto> {
    return this.http.post<InvestorDto>('/api/investor', dto);
  }

  update(id: number, dto: CreateInvestorDto): Observable<InvestorDto> {
    return this.http.put<InvestorDto>(`/api/investor/${id}`, dto);
  }

  addPayment(investorId: number, dto: CreateInvestorPaymentDto): Observable<InvestorPaymentDto> {
    return this.http.post<InvestorPaymentDto>(`/api/investor/${investorId}/payments`, dto);
  }

  deletePayment(investorId: number, paymentId: number): Observable<void> {
    return this.http.delete<void>(`/api/investor/${investorId}/payments/${paymentId}`);
  }
}
