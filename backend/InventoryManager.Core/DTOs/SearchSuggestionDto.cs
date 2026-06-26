namespace InventoryManager.Core.DTOs;

public class SearchSuggestionDto
{
    public string Sku { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal? ListPrice { get; set; }
    public string? ImageUrl { get; set; }
    public int? FirstImageId { get; set; }
}
