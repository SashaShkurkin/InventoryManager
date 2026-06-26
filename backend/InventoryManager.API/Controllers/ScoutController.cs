using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;
using InventoryManager.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScoutController(IScoutRepository repo) : ControllerBase
{
    // ── Owner endpoints ───────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> GetAll() =>
        Ok((await repo.GetAllAsync()).Select(ToDto));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> GetById(int id)
    {
        var scout = await repo.GetByIdAsync(id);
        return scout is null ? NotFound() : Ok(ToDto(scout));
    }

    [HttpGet("{id:int}/dashboard")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> GetDashboard(int id)
    {
        var scout = await repo.GetByIdAsync(id);
        if (scout is null) return NotFound();
        return Ok(await repo.GetDashboardAsync(scout));
    }

    [HttpPost]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Create([FromBody] CreateScoutDto dto)
    {
        var scout = new Scout
        {
            Name              = dto.Name,
            Email             = dto.Email,
            TagId             = dto.TagId,
            ProfitSharePercent = dto.ProfitSharePercent,
        };
        var created = await repo.CreateAsync(scout);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateScoutDto dto)
    {
        var updated = await repo.UpdateAsync(id, new Scout
        {
            Name              = dto.Name,
            Email             = dto.Email,
            TagId             = dto.TagId,
            ProfitSharePercent = dto.ProfitSharePercent,
        });
        return updated is null ? NotFound() : Ok(ToDto(updated));
    }

    // ── Scout self-service endpoint ───────────────────────────────────────────

    [HttpGet("dashboard")]
    [Authorize(Policy = "ScoutOnly")]
    public async Task<IActionResult> GetMyDashboard()
    {
        var idClaim = User.FindFirst("scout_id")?.Value;
        if (!int.TryParse(idClaim, out var scoutId))
            return Unauthorized();

        var scout = await repo.GetByIdAsync(scoutId);
        if (scout is null) return NotFound();

        return Ok(await repo.GetDashboardAsync(scout));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static ScoutDto ToDto(Scout s) => new()
    {
        Id                = s.Id,
        Name              = s.Name,
        Email             = s.Email,
        TagId             = s.TagId,
        ProfitSharePercent = s.ProfitSharePercent,
    };
}
