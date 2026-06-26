namespace InventoryManager.Core.Models;

public enum ExpenseType
{
    Fuel,
    Inventory,
    Advertising,
    Software,
    FurnitureMaterials,
    OfficeSupplies,
}

public class Expense
{
    public int Id { get; set; }
    public ExpenseType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public DateOnly Date { get; set; }
    public string? Address { get; set; }
    public byte[]? ReceiptData { get; set; }
    public string? ReceiptContentType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string ExpenseCode => Id.ToString("D6");
}
