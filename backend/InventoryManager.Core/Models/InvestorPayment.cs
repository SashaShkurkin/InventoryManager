namespace InventoryManager.Core.Models;

public class InvestorPayment
{
    public int Id { get; set; }
    public int InvestorId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly PaidDate { get; set; }
    public string Method { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Investor Investor { get; set; } = null!;
}
