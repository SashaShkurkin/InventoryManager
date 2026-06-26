namespace InventoryManager.Core.DTOs;

public class DashboardDto
{
    public decimal RevenueYtd { get; set; }
    public decimal ProfitYtd { get; set; }
    public decimal RevenueMtd { get; set; }
    public decimal ProfitMtd { get; set; }
    public int ItemsSoldYtd { get; set; }
    public int ItemsSoldMtd { get; set; }

    // 90-day rolling ROI and forward-looking projection
    public decimal Rolling90DayRoiPct { get; set; }
    public int     Rolling90DayItemCount { get; set; }
    public decimal ListedCostBasis { get; set; }
    public decimal ProjectedReturn { get; set; }
    public decimal ProjectedProfit { get; set; }
    public int     ProfitVelocity10k { get; set; }

    // Current-week snapshots for the overview quick-glance tiles
    public decimal WeekSalesRevenue { get; set; }
    public decimal WeekAcquisitionCost { get; set; }
}
