using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using InventoryManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InventoryManager.Infrastructure.Repositories;

public class ExpenseRepository(AppDbContext db) : IExpenseRepository
{
    public async Task<(IEnumerable<ExpenseDto> Items, int Total)> GetPagedAsync(int page, int pageSize)
    {
        var query = db.Expenses.OrderByDescending(e => e.Date).ThenByDescending(e => e.Id);
        var total = await query.CountAsync();
        var items = await query.Skip(page * pageSize).Take(pageSize).ToListAsync();
        return (items.Select(ToDto), total);
    }

    public async Task<Expense?> GetByIdAsync(int id) =>
        await db.Expenses.FindAsync(id);

    public async Task<Expense> CreateAsync(Expense expense)
    {
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        return expense;
    }

    public async Task<Expense?> UpdateAsync(int id, Expense updated)
    {
        var existing = await db.Expenses.FindAsync(id);
        if (existing is null) return null;

        existing.Type          = updated.Type;
        existing.Title         = updated.Title;
        existing.Amount        = updated.Amount;
        existing.PaymentMethod = updated.PaymentMethod;
        existing.Notes         = updated.Notes;
        existing.Date          = updated.Date;
        existing.Address       = updated.Address;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var expense = await db.Expenses.FindAsync(id);
        if (expense is null) return false;
        db.Expenses.Remove(expense);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task SaveReceiptAsync(int id, byte[] data, string contentType)
    {
        var expense = await db.Expenses.FindAsync(id);
        if (expense is null) return;
        expense.ReceiptData        = data;
        expense.ReceiptContentType = contentType;
        await db.SaveChangesAsync();
    }

    private static ExpenseDto ToDto(Expense e) => new()
    {
        Id            = e.Id,
        ExpenseCode   = e.Id.ToString("D6"),
        Type          = e.Type.ToString(),
        Title         = e.Title,
        Amount        = e.Amount,
        PaymentMethod = e.PaymentMethod,
        Notes         = e.Notes,
        Date          = e.Date,
        Address       = e.Address,
        HasReceipt    = e.ReceiptData is { Length: > 0 },
    };
}
