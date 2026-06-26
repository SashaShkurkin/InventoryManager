using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;

namespace InventoryManager.Core.Interfaces;

public interface IExpenseRepository
{
    Task<(IEnumerable<ExpenseDto> Items, int Total)> GetPagedAsync(int page, int pageSize);
    Task<Expense?> GetByIdAsync(int id);
    Task<Expense> CreateAsync(Expense expense);
    Task<Expense?> UpdateAsync(int id, Expense updated);
    Task<bool> DeleteAsync(int id);
    Task SaveReceiptAsync(int id, byte[] data, string contentType);
}
