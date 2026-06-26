namespace InventoryManager.Core.Models;

public class Investor
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FundingTag { get; set; } = string.Empty;
    public decimal FundsInvested { get; set; }
    public decimal ProfitSharePercent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
