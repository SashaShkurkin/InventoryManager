namespace InventoryManager.Core.DTOs;

public class InvestorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FundingTag { get; set; } = string.Empty;
    public decimal FundsInvested { get; set; }
    public decimal ProfitSharePercent { get; set; }
}

public class InvestorDashboardDto
{
    public InvestorDto Investor { get; set; } = new();
    public decimal FundsDeployed { get; set; }
    public int ItemsProcessing { get; set; }
    public int ItemsListed { get; set; }
    public int ItemsSold { get; set; }
    public decimal TotalReturn { get; set; }
    public decimal TotalProfitShare { get; set; }
    public List<InventoryItemDto> Items { get; set; } = new();
    public List<InvestorPaymentDto> Payments { get; set; } = new();
}

public class InvestorPaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public DateOnly PaidDate { get; set; }
    public string Method { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CreateInvestorPaymentDto
{
    public decimal Amount { get; set; }
    public DateOnly PaidDate { get; set; }
    public string Method { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CreateInvestorDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FundingTag { get; set; } = string.Empty;
    public decimal FundsInvested { get; set; }
    public decimal ProfitSharePercent { get; set; }
}
