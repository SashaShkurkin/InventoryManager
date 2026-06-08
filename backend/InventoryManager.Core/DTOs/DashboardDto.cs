namespace InventoryManager.Core.DTOs;

public class DashboardDto
{
    public decimal RevenueYtd { get; set; }
    public decimal ProfitYtd { get; set; }
    public decimal RevenueMtd { get; set; }
    public decimal ProfitMtd { get; set; }
    public int ItemsSoldYtd { get; set; }
    public int ItemsSoldMtd { get; set; }
}
