using InventoryManager.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(IInventoryRepository repo) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Get()
    {
        var data = await repo.GetDashboardAsync();
        return Ok(data);
    }
}
