import { InventoryItem } from './inventory.models';

export interface InvestorDto {
  id: number;
  name: string;
  email: string;
  fundingTag: string;
  fundsInvested: number;
  profitSharePercent: number;
}

export interface InvestorPaymentDto {
  id: number;
  amount: number;
  paidDate: string;
  method: string;
  notes?: string;
}

export interface CreateInvestorPaymentDto {
  amount: number;
  paidDate: string;
  method: string;
  notes?: string;
}

export interface InvestorDashboardDto {
  investor: InvestorDto;
  fundsDeployed: number;
  itemsProcessing: number;
  itemsListed: number;
  itemsSold: number;
  totalReturn: number;
  totalProfitShare: number;
  items: InventoryItem[];
  payments: InvestorPaymentDto[];
}

export interface CreateInvestorDto {
  name: string;
  email: string;
  fundingTag: string;
  fundsInvested: number;
  profitSharePercent: number;
}
