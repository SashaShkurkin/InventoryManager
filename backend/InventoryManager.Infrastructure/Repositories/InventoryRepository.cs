using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using InventoryManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InventoryManager.Infrastructure.Repositories;

public class InventoryRepository(AppDbContext db) : IInventoryRepository
{
    public async Task<(IEnumerable<InventoryItem> Items, int TotalCount)> GetFilteredAsync(
        string? state, decimal? minPrice, decimal? maxPrice, int page, int pageSize)
    {
        var query = db.InventoryItems.AsQueryable();

        if (!string.IsNullOrWhiteSpace(state) &&
            Enum.TryParse<ItemState>(state, true, out var parsedState))
        {
            query = query.Where(i => i.State == parsedState);
        }
        else if (string.IsNullOrWhiteSpace(state))
        {
            query = query.Where(i => i.State != ItemState.Archived);
        }

        if (minPrice.HasValue)
            query = query.Where(i => i.ListPrice >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(i => i.ListPrice <= maxPrice.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<IEnumerable<SearchSuggestionDto>> SearchSuggestionsAsync(string query)
    {
        var lower = query.ToLower();
        return await db.InventoryItems
            .Where(i => i.State != ItemState.Archived &&
                        (i.Sku.ToLower().Contains(lower) ||
                         i.Title.ToLower().Contains(lower) ||
                         (i.Tags != null && i.Tags.ToLower().Contains(lower))))
            .OrderBy(i => i.Sku)
            .Take(10)
            .Select(i => new SearchSuggestionDto
            {
                Sku = i.Sku,
                Title = i.Title,
                ListPrice = i.ListPrice,
                ImageUrl = i.ImageUrl
            })
            .ToListAsync();
    }

    public async Task<InventoryItem?> GetBySkuAsync(string sku) =>
        await db.InventoryItems.FirstOrDefaultAsync(i => i.Sku == sku);

    public async Task<InventoryItem> CreateAsync(InventoryItem item)
    {
        db.InventoryItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<InventoryItem?> UpdateAsync(string sku, InventoryItem updated)
    {
        var existing = await db.InventoryItems.FirstOrDefaultAsync(i => i.Sku == sku);
        if (existing is null) return null;

        existing.Title = updated.Title;
        existing.Description = updated.Description;
        existing.AcquisitionCost = updated.AcquisitionCost;
        existing.LaborCost = updated.LaborCost;
        existing.MaterialsCost = updated.MaterialsCost;
        existing.PrepCost = updated.PrepCost;
        existing.TravelCost = updated.TravelCost;
        existing.ShippingCost = updated.ShippingCost;
        existing.ListPrice = updated.ListPrice;
        existing.SoldPrice = updated.SoldPrice;
        existing.Profit = updated.Profit;
        existing.Type = updated.Type;
        existing.SubType = updated.SubType;
        existing.Style = updated.Style;
        existing.Color = updated.Color;
        existing.Tags = updated.Tags;
        // ImageUrl is intentionally NOT updated here — managed via image upload endpoints
        existing.DateAcquired = updated.DateAcquired;
        existing.DateListed = updated.DateListed;
        existing.DateSold = updated.DateSold;
        existing.State = updated.State;
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> PatchStateAsync(string sku, ItemState state)
    {
        var item = await db.InventoryItems.FirstOrDefaultAsync(i => i.Sku == sku);
        if (item is null) return false;

        item.State = state;
        item.UpdatedAt = DateTime.UtcNow;
        if (state == ItemState.Sold && !item.DateSold.HasValue)
            item.DateSold = DateOnly.FromDateTime(DateTime.UtcNow);

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string sku)
    {
        var item = await db.InventoryItems.FirstOrDefaultAsync(i => i.Sku == sku);
        if (item is null) return false;

        db.InventoryItems.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var ytdStart = new DateOnly(now.Year, 1, 1);
        var mtdStart = new DateOnly(now.Year, now.Month, 1);

        var soldItems = await db.InventoryItems
            .Where(i => i.State == ItemState.Sold && i.DateSold.HasValue)
            .ToListAsync();

        var ytd = soldItems.Where(i => i.DateSold >= ytdStart).ToList();
        var mtd = soldItems.Where(i => i.DateSold >= mtdStart).ToList();

        return new DashboardDto
        {
            RevenueYtd = ytd.Sum(i => i.SoldPrice ?? 0),
            ProfitYtd = ytd.Sum(i => i.Profit ?? 0),
            RevenueMtd = mtd.Sum(i => i.SoldPrice ?? 0),
            ProfitMtd = mtd.Sum(i => i.Profit ?? 0),
            ItemsSoldYtd = ytd.Count,
            ItemsSoldMtd = mtd.Count
        };
    }

    // ── Image methods ────────────────────────────────────────────────────────

    public async Task<IEnumerable<ItemImageMetaDto>> GetImagesAsync(string sku) =>
        await db.ItemImages
            .Where(i => i.ItemSku == sku)
            .OrderBy(i => i.SortOrder).ThenBy(i => i.Id)
            .Select(i => new ItemImageMetaDto { Id = i.Id, SortOrder = i.SortOrder })
            .ToListAsync();

    public async Task<Dictionary<string, int>> GetFirstImageIdsAsync(IEnumerable<string> skus)
    {
        var skuList = skus.ToList();
        var images = await db.ItemImages
            .Where(img => skuList.Contains(img.ItemSku))
            .OrderBy(img => img.SortOrder).ThenBy(img => img.Id)
            .Select(img => new { img.ItemSku, img.Id })
            .ToListAsync();

        return images
            .GroupBy(img => img.ItemSku)
            .ToDictionary(g => g.Key, g => g.First().Id);
    }

    public async Task<ItemImage?> GetImageDataAsync(int id) =>
        await db.ItemImages.FindAsync(id);

    public async Task<ItemImage> AddImageAsync(string sku, byte[] data, string contentType, int sortOrder)
    {
        var img = new ItemImage
        {
            ItemSku = sku,
            ImageData = data,
            ContentType = contentType,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };
        db.ItemImages.Add(img);
        await db.SaveChangesAsync();
        return img;
    }

    public async Task<bool> DeleteImageAsync(int id)
    {
        var img = await db.ItemImages.FindAsync(id);
        if (img is null) return false;
        db.ItemImages.Remove(img);
        await db.SaveChangesAsync();
        return true;
    }
}
