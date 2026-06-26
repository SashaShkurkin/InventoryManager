namespace InventoryManager.Core.Models;

public class Scout
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TagId { get; set; } = string.Empty;
    public decimal ProfitSharePercent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
