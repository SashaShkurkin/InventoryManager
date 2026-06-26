namespace InventoryManager.Core.DTOs;

public class ScoutDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TagId { get; set; } = string.Empty;
    public decimal ProfitSharePercent { get; set; }
}

public class ScoutDashboardDto
{
    public ScoutDto Scout { get; set; } = new();
    public int ItemCount { get; set; }
    public decimal PurchaseCosts { get; set; }
    public decimal TotalReturn { get; set; }
    public int ItemsProcessing { get; set; }
    public int ItemsListed { get; set; }
    public int ItemsSold { get; set; }
    public List<InventoryItemDto> Items { get; set; } = new();
}

public class CreateScoutDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TagId { get; set; } = string.Empty;
    public decimal ProfitSharePercent { get; set; }
}
