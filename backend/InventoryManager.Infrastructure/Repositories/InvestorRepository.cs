using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using InventoryManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InventoryManager.Infrastructure.Repositories;

public class InvestorRepository(AppDbContext db) : IInvestorRepository
{
    public async Task<IEnumerable<Investor>> GetAllAsync() =>
        await db.Investors.OrderBy(i => i.Name).ToListAsync();

    public async Task<Investor?> GetByIdAsync(int id) =>
        await db.Investors.FindAsync(id);

    public async Task<Investor?> GetByEmailAsync(string email) =>
        await db.Investors.FirstOrDefaultAsync(i =>
            i.Email.ToLower() == email.ToLower());

    public async Task<Investor> CreateAsync(Investor investor)
    {
        db.Investors.Add(investor);
        await db.SaveChangesAsync();
        return investor;
    }

    public async Task<Investor?> UpdateAsync(int id, Investor updated)
    {
        var existing = await db.Investors.FindAsync(id);
        if (existing is null) return null;

        existing.Name = updated.Name;
        existing.Email = updated.Email;
        existing.FundingTag = updated.FundingTag;
        existing.FundsInvested = updated.FundsInvested;
        existing.ProfitSharePercent = updated.ProfitSharePercent;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<InvestorDashboardDto> GetDashboardAsync(Investor investor)
    {
        var tag = investor.FundingTag;

        // Load all items then filter in memory — inventory is small, FIND_IN_SET not needed
        var allItems = await db.InventoryItems.ToListAsync();
        var tagged = allItems
            .Where(i => (i.Tags ?? "")
                .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Contains(tag, StringComparer.OrdinalIgnoreCase))
            .ToList();

        var sold = tagged.Where(i => i.State == ItemState.Sold).ToList();

        var fundsDeployed   = tagged.Sum(i => i.AcquisitionCost ?? 0m);
        var itemsProcessing = tagged.Count(i => i.State == ItemState.Processing);
        var itemsListed     = tagged.Count(i => i.State == ItemState.Listed);
        var itemsSold       = sold.Count;

        // Return = capital recovered from sold items + profit share from those same items
        var soldAcqCost      = sold.Sum(i => i.AcquisitionCost ?? 0m);
        var soldProfit       = sold.Sum(i => i.Profit ?? 0m);
        var totalProfitShare = soldProfit * (investor.ProfitSharePercent / 100m);
        var returnAmt        = soldAcqCost + totalProfitShare;

        // Load payment ledger
        var payments = await db.InvestorPayments
            .Where(p => p.InvestorId == investor.Id)
            .OrderByDescending(p => p.PaidDate)
            .ToListAsync();

        // Fetch first image ID per SKU so the frontend can render thumbnails
        var taggedSkus = tagged.Select(i => i.Sku).ToList();
        var firstImages = await db.ItemImages
            .Where(img => taggedSkus.Contains(img.ItemSku))
            .OrderBy(img => img.SortOrder).ThenBy(img => img.Id)
            .Select(img => new { img.ItemSku, img.Id })
            .ToListAsync();
        var firstImageMap = firstImages
            .GroupBy(img => img.ItemSku)
            .ToDictionary(g => g.Key, g => g.First().Id);

        var items = tagged.Select(i =>
        {
            var dto = MapItem(i);
            if (firstImageMap.TryGetValue(i.Sku, out var imgId))
                dto.FirstImageId = imgId;
            return dto;
        }).OrderBy(i => i.State).ToList();

        return new InvestorDashboardDto
        {
            Investor = new InvestorDto
            {
                Id                 = investor.Id,
                Name               = investor.Name,
                Email              = investor.Email,
                FundingTag         = investor.FundingTag,
                FundsInvested      = investor.FundsInvested,
                ProfitSharePercent = investor.ProfitSharePercent,
            },
            FundsDeployed    = fundsDeployed,
            ItemsProcessing  = itemsProcessing,
            ItemsListed      = itemsListed,
            ItemsSold        = itemsSold,
            TotalReturn      = returnAmt,
            TotalProfitShare = totalProfitShare,
            Items            = items,
            Payments         = payments.Select(p => new InvestorPaymentDto
            {
                Id       = p.Id,
                Amount   = p.Amount,
                PaidDate = p.PaidDate,
                Method   = p.Method,
                Notes    = p.Notes,
            }).ToList(),
        };
    }

    public async Task<InvestorPayment> AddPaymentAsync(int investorId, InvestorPayment payment)
    {
        payment.InvestorId = investorId;
        db.InvestorPayments.Add(payment);
        await db.SaveChangesAsync();
        return payment;
    }

    public async Task<bool> DeletePaymentAsync(int investorId, int paymentId)
    {
        var payment = await db.InvestorPayments
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.InvestorId == investorId);
        if (payment is null) return false;
        db.InvestorPayments.Remove(payment);
        await db.SaveChangesAsync();
        return true;
    }

    private static InventoryItemDto MapItem(InventoryItem i) => new()
    {
        Id              = i.Id,
        Sku             = i.Sku,
        Title           = i.Title,
        Description     = i.Description,
        AcquisitionCost = i.AcquisitionCost,
        LaborCost       = i.LaborCost,
        MaterialsCost   = i.MaterialsCost,
        PrepCost        = i.PrepCost,
        TravelCost      = i.TravelCost,
        ShippingCost    = i.ShippingCost,
        ListPrice       = i.ListPrice,
        SoldPrice       = i.SoldPrice,
        Profit          = i.Profit,
        Type            = i.Type,
        SubType         = i.SubType,
        Style           = i.Style,
        Color           = i.Color,
        Tags            = i.Tags,
        CostCode        = i.CostCode,
        ImageUrl        = i.ImageUrl,
        DateAcquired    = i.DateAcquired,
        DateListed      = i.DateListed,
        DateSold        = i.DateSold,
        State     = i.State.ToString(),
        CreatedAt = i.CreatedAt,
        UpdatedAt = i.UpdatedAt,
    };
}
