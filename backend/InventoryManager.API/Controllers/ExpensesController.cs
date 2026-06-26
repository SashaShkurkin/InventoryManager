using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "OwnerOnly")]
public class ExpensesController(IExpenseRepository repo) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] int page = 0, [FromQuery] int pageSize = 50)
    {
        var (items, total) = await repo.GetPagedAsync(page, pageSize);
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var expense = await repo.GetByIdAsync(id);
        return expense is null ? NotFound() : Ok(ToDto(expense));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        if (!Enum.TryParse<ExpenseType>(dto.Type, out var type))
            return BadRequest($"Invalid expense type: {dto.Type}");

        var expense = new Expense
        {
            Type          = type,
            Title         = dto.Title,
            Amount        = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            Notes         = dto.Notes,
            Date          = dto.Date,
            Address       = dto.Address,
        };
        var created = await repo.CreateAsync(expense);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateExpenseDto dto)
    {
        if (!Enum.TryParse<ExpenseType>(dto.Type, out var type))
            return BadRequest($"Invalid expense type: {dto.Type}");

        var updated = await repo.UpdateAsync(id, new Expense
        {
            Type          = type,
            Title         = dto.Title,
            Amount        = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            Notes         = dto.Notes,
            Date          = dto.Date,
            Address       = dto.Address,
        });
        return updated is null ? NotFound() : Ok(ToDto(updated));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await repo.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/receipt")]
    public async Task<IActionResult> UploadReceipt(int id, IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest("No file provided.");
        var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf" };
        if (!allowed.Contains(file.ContentType)) return BadRequest("Unsupported file type.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        await repo.SaveReceiptAsync(id, ms.ToArray(), file.ContentType);
        return NoContent();
    }

    [HttpGet("{id:int}/receipt")]
    public async Task<IActionResult> GetReceipt(int id)
    {
        var expense = await repo.GetByIdAsync(id);
        if (expense?.ReceiptData is null) return NotFound();
        return File(expense.ReceiptData, expense.ReceiptContentType!);
    }

    private static ExpenseDto ToDto(Expense e) => new()
    {
        Id            = e.Id,
        ExpenseCode   = e.Id.ToString("D6"),
        Type          = e.Type.ToString(),
        Title         = e.Title,
        Amount        = e.Amount,
        PaymentMethod = e.PaymentMethod,
        Notes         = e.Notes,
        Date          = e.Date,
        Address       = e.Address,
        HasReceipt    = e.ReceiptData is { Length: > 0 },
    };
}
