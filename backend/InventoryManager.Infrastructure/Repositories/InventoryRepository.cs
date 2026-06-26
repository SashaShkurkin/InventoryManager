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

        if (!string.IsNullOrWhiteSpace(state))
        {
            var parts = state.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var parsed = parts
                .Where(p => Enum.TryParse<ItemState>(p, true, out _))
                .Select(p => Enum.Parse<ItemState>(p, true))
                .ToList();
            if (parsed.Count == 1)
                query = query.Where(i => i.State == parsed[0]);
            else if (parsed.Count > 1)
                query = query.Where(i => parsed.Contains(i.State));
        }
        else
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

    public async Task<IEnumerable<SearchSuggestionDto>> SearchSuggestionsAsync(string query, string? state = null)
    {
        var lower = query.ToLower();
        var stateFilter = state != null && Enum.TryParse<ItemState>(state, out var parsed) ? parsed : (ItemState?)null;
        var results = await db.InventoryItems
            .Where(i => (stateFilter != null ? i.State == stateFilter : i.State != ItemState.Archived) &&
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

        var firstImages = await GetFirstImageIdsAsync(results.Select(r => r.Sku));
        foreach (var r in results)
            if (firstImages.TryGetValue(r.Sku, out var imgId))
                r.FirstImageId = imgId;

        return results;
    }

    public async Task<InventoryItem?> GetBySkuAsync(string sku) =>
        await db.InventoryItems.FirstOrDefaultAsync(i => i.Sku == sku);

    public async Task<InventoryItem> CreateAsync(InventoryItem item)
    {
        item.CostCode = ComputeCostCode(item);
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
        existing.Height = updated.Height;
        existing.Width = updated.Width;
        existing.LengthDepth = updated.LengthDepth;
        existing.AgreedPrice = updated.AgreedPrice;
        existing.PendingSaleDate = updated.PendingSaleDate;
        existing.PendingSaleTime = updated.PendingSaleTime;
        existing.PendingSaleMethod = updated.PendingSaleMethod;
        existing.CostCode = ComputeCostCode(existing);
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
        var ytdStart    = new DateOnly(now.Year, 1, 1);
        var mtdStart    = new DateOnly(now.Year, now.Month, 1);
        var rolling90   = DateOnly.FromDateTime(now.AddDays(-90));

        // YTD = Sold + Archived (completed sales)
        var ytdItems = await db.InventoryItems
            .Where(i => (i.State == ItemState.Sold || i.State == ItemState.Archived)
                        && i.DateSold.HasValue
                        && i.DateSold >= ytdStart)
            .ToListAsync();

        // MTD = Sold only (current month active sales)
        var mtdItems = await db.InventoryItems
            .Where(i => i.State == ItemState.Sold
                        && i.DateSold.HasValue
                        && i.DateSold >= mtdStart)
            .ToListAsync();

        // 90-day rolling window: Sold + Archived with dateSold in window
        var rolling90Items = await db.InventoryItems
            .Where(i => (i.State == ItemState.Sold || i.State == ItemState.Archived)
                        && i.DateSold.HasValue
                        && i.DateSold >= rolling90)
            .ToListAsync();

        // Per-item ROI % = profit / totalCost; skip items with zero cost basis
        static decimal TotalCost(InventoryItem i) =>
            (i.AcquisitionCost ?? 0) + (i.LaborCost ?? 0) + (i.MaterialsCost ?? 0)
            + (i.PrepCost ?? 0) + (i.TravelCost ?? 0) + (i.ShippingCost ?? 0);

        var roiSamples = rolling90Items
            .Where(i => i.AcquisitionCost > 0)
            .Select(i => (cost: TotalCost(i), profit: i.Profit ?? 0))
            .Where(x => x.cost > 0)
            .Select(x => x.profit / x.cost * 100m)
            .ToList();

        var rolling90DayRoiPct = roiSamples.Count > 0
            ? roiSamples.Average()
            : 0m;

        // Listed inventory cost basis
        var listedItems = await db.InventoryItems
            .Where(i => i.State == ItemState.Listed)
            .ToListAsync();

        var listedCostBasis = listedItems.Sum(TotalCost);

        // Current calendar week (Mon–Sun) snapshots
        var today = DateOnly.FromDateTime(now);
        var dow = (int)today.DayOfWeek;                     // 0=Sun … 6=Sat
        var weekStart = today.AddDays(dow == 0 ? -6 : -(dow - 1)); // back to Monday

        var weekSalesRevenue = await db.InventoryItems
            .Where(i => (i.State == ItemState.Sold || i.State == ItemState.Archived)
                        && i.DateSold.HasValue && i.DateSold >= weekStart)
            .SumAsync(i => i.SoldPrice ?? 0);

        var weekAcquisitionCost = await db.InventoryItems
            .Where(i => i.DateAcquired.HasValue && i.DateAcquired >= weekStart)
            .SumAsync(i => i.AcquisitionCost ?? 0);

        // Apply 90-day ROI to listed cost basis, then apply 25% safety buffer
        var projectedReturn = listedCostBasis * (rolling90DayRoiPct / 100m) * 0.75m;

        return new DashboardDto
        {
            RevenueYtd  = ytdItems.Sum(i => i.SoldPrice ?? 0),
            ProfitYtd   = ytdItems.Sum(i => i.Profit   ?? 0),
            RevenueMtd  = mtdItems.Sum(i => i.SoldPrice ?? 0),
            ProfitMtd   = mtdItems.Sum(i => i.Profit   ?? 0),
            ItemsSoldYtd = ytdItems.Count,
            ItemsSoldMtd = mtdItems.Count,
            Rolling90DayRoiPct    = Math.Round(rolling90DayRoiPct, 1),
            Rolling90DayItemCount = roiSamples.Count,
            ListedCostBasis       = listedCostBasis,
            ProjectedReturn       = Math.Round(projectedReturn, 2),
            ProjectedProfit       = Math.Round(projectedReturn - listedCostBasis, 2),
            ProfitVelocity10k     = listedItems.Count > 0 && projectedReturn > listedCostBasis
                ? (int)Math.Ceiling(10000m * listedItems.Count / (projectedReturn - listedCostBasis))
                : 0,
            WeekSalesRevenue    = weekSalesRevenue,
            WeekAcquisitionCost = weekAcquisitionCost,
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

    // Total cost → cents → zero-pad to 5 digits → reverse string
    // e.g. $24.25 → 2425 → "02425" → "52420"
    private static string? ComputeCostCode(InventoryItem item)
    {
        var total = (item.AcquisitionCost ?? 0) + (item.LaborCost ?? 0)
                  + (item.MaterialsCost ?? 0) + (item.PrepCost ?? 0)
                  + (item.TravelCost ?? 0) + (item.ShippingCost ?? 0);
        if (total <= 0) return null;
        var cents = (int)Math.Round(total * 100);
        if (cents > 99999) cents = 99999; // cap at 5 digits
        var padded = cents.ToString("D5");
        return new string(padded.Reverse().ToArray());
    }
}
