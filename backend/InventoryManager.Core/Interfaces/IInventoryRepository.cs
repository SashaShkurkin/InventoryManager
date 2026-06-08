using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;

namespace InventoryManager.Core.Interfaces;

public interface IInventoryRepository
{
    Task<(IEnumerable<InventoryItem> Items, int TotalCount)> GetFilteredAsync(
        string? state, decimal? minPrice, decimal? maxPrice, int page, int pageSize);
    Task<IEnumerable<SearchSuggestionDto>> SearchSuggestionsAsync(string query);
    Task<InventoryItem?> GetBySkuAsync(string sku);
    Task<InventoryItem> CreateAsync(InventoryItem item);
    Task<InventoryItem?> UpdateAsync(string sku, InventoryItem item);
    Task<bool> PatchStateAsync(string sku, ItemState state);
    Task<bool> DeleteAsync(string sku);
    Task<DashboardDto> GetDashboardAsync();
}
