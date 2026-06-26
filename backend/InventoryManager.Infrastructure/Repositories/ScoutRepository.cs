using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using InventoryManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InventoryManager.Infrastructure.Repositories;

public class ScoutRepository(AppDbContext db) : IScoutRepository
{
    public async Task<IEnumerable<Scout>> GetAllAsync() =>
        await db.Scouts.OrderBy(s => s.Name).ToListAsync();

    public async Task<Scout?> GetByIdAsync(int id) =>
        await db.Scouts.FindAsync(id);

    public async Task<Scout?> GetByEmailAsync(string email) =>
        await db.Scouts.FirstOrDefaultAsync(s =>
            s.Email.ToLower() == email.ToLower());

    public async Task<Scout> CreateAsync(Scout scout)
    {
        db.Scouts.Add(scout);
        await db.SaveChangesAsync();
        return scout;
    }

    public async Task<Scout?> UpdateAsync(int id, Scout updated)
    {
        var existing = await db.Scouts.FindAsync(id);
        if (existing is null) return null;

        existing.Name              = updated.Name;
        existing.Email             = updated.Email;
        existing.TagId             = updated.TagId;
        existing.ProfitSharePercent = updated.ProfitSharePercent;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<ScoutDashboardDto> GetDashboardAsync(Scout scout)
    {
        var tag = scout.TagId;

        var allItems = await db.InventoryItems.ToListAsync();
        var tagged   = allItems
            .Where(i => (i.Tags ?? "")
                .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Contains(tag, StringComparer.OrdinalIgnoreCase))
            .ToList();

        var sold = tagged.Where(i => i.State == ItemState.Sold).ToList();

        var soldAcqCost = sold.Sum(i => i.AcquisitionCost ?? 0m);
        var soldProfit  = sold.Sum(i => i.Profit ?? 0m);

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

        return new ScoutDashboardDto
        {
            Scout = new ScoutDto
            {
                Id                = scout.Id,
                Name              = scout.Name,
                Email             = scout.Email,
                TagId             = scout.TagId,
                ProfitSharePercent = scout.ProfitSharePercent,
            },
            ItemCount       = tagged.Count,
            PurchaseCosts   = tagged.Sum(i => i.AcquisitionCost ?? 0m),
            TotalReturn     = soldAcqCost + soldProfit * (scout.ProfitSharePercent / 100m),
            ItemsProcessing = tagged.Count(i => i.State == ItemState.Processing),
            ItemsListed     = tagged.Count(i => i.State == ItemState.Listed),
            ItemsSold       = sold.Count,
            Items           = items,
        };
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
        State           = i.State.ToString(),
        CreatedAt       = i.CreatedAt,
        UpdatedAt       = i.UpdatedAt,
    };
}
