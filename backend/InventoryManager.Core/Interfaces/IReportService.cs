namespace InventoryManager.Core.Interfaces;

public interface IReportService
{
    Task<byte[]> GenerateAllTimeInventoryReportAsync();
    Task<byte[]> GenerateCurrentInventoryReportAsync();
    Task<byte[]> GenerateRevenueReportAsync();
}
