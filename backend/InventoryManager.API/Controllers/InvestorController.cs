using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;
using InventoryManager.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvestorController(IInvestorRepository repo) : ControllerBase
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
        var investor = await repo.GetByIdAsync(id);
        return investor is null ? NotFound() : Ok(ToDto(investor));
    }

    [HttpGet("{id:int}/dashboard")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> GetDashboard(int id)
    {
        var investor = await repo.GetByIdAsync(id);
        if (investor is null) return NotFound();
        return Ok(await repo.GetDashboardAsync(investor));
    }

    [HttpPost]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Create([FromBody] CreateInvestorDto dto)
    {
        var investor = new Investor
        {
            Name              = dto.Name,
            Email             = dto.Email,
            FundingTag        = dto.FundingTag,
            FundsInvested     = dto.FundsInvested,
            ProfitSharePercent = dto.ProfitSharePercent,
        };
        var created = await repo.CreateAsync(investor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateInvestorDto dto)
    {
        var updated = await repo.UpdateAsync(id, new Investor
        {
            Name              = dto.Name,
            Email             = dto.Email,
            FundingTag        = dto.FundingTag,
            FundsInvested     = dto.FundsInvested,
            ProfitSharePercent = dto.ProfitSharePercent,
        });
        return updated is null ? NotFound() : Ok(ToDto(updated));
    }

    // ── Payment ledger endpoints ──────────────────────────────────────────────

    [HttpPost("{id:int}/payments")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> AddPayment(int id, [FromBody] CreateInvestorPaymentDto dto)
    {
        var investor = await repo.GetByIdAsync(id);
        if (investor is null) return NotFound();

        var payment = new InvestorPayment
        {
            Amount   = dto.Amount,
            PaidDate = dto.PaidDate,
            Method   = dto.Method,
            Notes    = dto.Notes,
        };
        var created = await repo.AddPaymentAsync(id, payment);
        return Ok(new InvestorPaymentDto
        {
            Id       = created.Id,
            Amount   = created.Amount,
            PaidDate = created.PaidDate,
            Method   = created.Method,
            Notes    = created.Notes,
        });
    }

    [HttpDelete("{id:int}/payments/{paymentId:int}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> DeletePayment(int id, int paymentId)
    {
        var deleted = await repo.DeletePaymentAsync(id, paymentId);
        return deleted ? NoContent() : NotFound();
    }

    // ── Investor self-service endpoint ────────────────────────────────────────

    /// <summary>Current investor's own dashboard — reads investor_id from JWT.</summary>
    [HttpGet("dashboard")]
    [Authorize(Policy = "InvestorOnly")]
    public async Task<IActionResult> GetMyDashboard()
    {
        var idClaim = User.FindFirst("investor_id")?.Value;
        if (!int.TryParse(idClaim, out var investorId))
            return Unauthorized();

        var investor = await repo.GetByIdAsync(investorId);
        if (investor is null) return NotFound();

        return Ok(await repo.GetDashboardAsync(investor));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static InvestorDto ToDto(Investor i) => new()
    {
        Id                = i.Id,
        Name              = i.Name,
        Email             = i.Email,
        FundingTag        = i.FundingTag,
        FundsInvested     = i.FundsInvested,
        ProfitSharePercent = i.ProfitSharePercent,
    };
}
