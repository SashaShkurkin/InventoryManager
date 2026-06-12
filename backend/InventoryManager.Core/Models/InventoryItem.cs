namespace InventoryManager.Core.Models;

public class InventoryItem
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? AcquisitionCost { get; set; }
    public decimal? LaborCost { get; set; }
    public decimal? MaterialsCost { get; set; }
    public decimal? PrepCost { get; set; }
    public decimal? TravelCost { get; set; }
    public decimal? ShippingCost { get; set; }
    public decimal? ListPrice { get; set; }
    public decimal? SoldPrice { get; set; }
    public decimal? Profit { get; set; }
    public string? Type { get; set; }
    public string? SubType { get; set; }
    public string? Style { get; set; }
    public string? Color { get; set; }
    public string? Tags { get; set; }
    public string? ImageUrl { get; set; }
    public DateOnly? DateAcquired { get; set; }
    public DateOnly? DateListed { get; set; }
    public DateOnly? DateSold { get; set; }
    public ItemState State { get; set; } = ItemState.Processing;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ItemState
{
    Processing,
    Listed,
    Sold,
    Archived
}
