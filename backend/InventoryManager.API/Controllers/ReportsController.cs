using InventoryManager.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController(IReportService reports) : ControllerBase
{
    [HttpGet("all-time")]
    public async Task<IActionResult> AllTime()
    {
        var pdf = await reports.GenerateAllTimeInventoryReportAsync();
        return File(pdf, "application/pdf", "all-time-inventory.pdf");
    }

    [HttpGet("current")]
    public async Task<IActionResult> Current()
    {
        var pdf = await reports.GenerateCurrentInventoryReportAsync();
        return File(pdf, "application/pdf", "current-inventory.pdf");
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue()
    {
        var pdf = await reports.GenerateRevenueReportAsync();
        return File(pdf, "application/pdf", "revenue-report.pdf");
    }
}
