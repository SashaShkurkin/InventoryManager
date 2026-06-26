namespace InventoryManager.Core.DTOs;

public class ExpenseDto
{
    public int Id { get; set; }
    public string ExpenseCode { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public DateOnly Date { get; set; }
    public string? Address { get; set; }
    public bool HasReceipt { get; set; }
}

public class CreateExpenseDto
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public DateOnly Date { get; set; }
    public string? Address { get; set; }
}
