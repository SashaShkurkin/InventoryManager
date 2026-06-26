using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;

namespace InventoryManager.Core.Interfaces;

public interface IInvestorRepository
{
    Task<IEnumerable<Investor>> GetAllAsync();
    Task<Investor?> GetByIdAsync(int id);
    Task<Investor?> GetByEmailAsync(string email);
    Task<Investor> CreateAsync(Investor investor);
    Task<Investor?> UpdateAsync(int id, Investor investor);
    Task<InvestorDashboardDto> GetDashboardAsync(Investor investor);
    Task<InvestorPayment> AddPaymentAsync(int investorId, InvestorPayment payment);
    Task<bool> DeletePaymentAsync(int investorId, int paymentId);
}
