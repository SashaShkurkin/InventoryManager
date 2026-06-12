namespace InventoryManager.Core.Models;

public class ItemImage
{
    public int Id { get; set; }
    public string ItemSku { get; set; } = string.Empty;
    public byte[] ImageData { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
