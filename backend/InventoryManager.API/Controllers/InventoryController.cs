using AutoMapper;
using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController(IInventoryRepository repo, IMapper mapper, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? state,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var (items, total) = await repo.GetFilteredAsync(state, minPrice, maxPrice, page, pageSize);
        return Ok(new
        {
            total,
            page,
            pageSize,
            items = mapper.Map<IEnumerable<InventoryItemDto>>(items)
        });
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<SearchSuggestionDto>());

        var results = await repo.SearchSuggestionsAsync(q);
        return Ok(results);
    }

    [HttpGet("{sku}")]
    public async Task<IActionResult> GetBySku(string sku)
    {
        var item = await repo.GetBySkuAsync(sku);
        if (item is null) return NotFound();
        return Ok(mapper.Map<InventoryItemDto>(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInventoryItemDto dto)
    {
        var item = mapper.Map<InventoryItem>(dto);
        var created = await repo.CreateAsync(item);
        return CreatedAtAction(nameof(GetBySku), new { sku = created.Sku }, mapper.Map<InventoryItemDto>(created));
    }

    [HttpPut("{sku}")]
    public async Task<IActionResult> Update(string sku, [FromBody] UpdateInventoryItemDto dto)
    {
        var item = mapper.Map<InventoryItem>(dto);
        var updated = await repo.UpdateAsync(sku, item);
        if (updated is null) return NotFound();
        return Ok(mapper.Map<InventoryItemDto>(updated));
    }

    [HttpPatch("{sku}/state")]
    public async Task<IActionResult> PatchState(string sku, [FromBody] PatchStateDto dto)
    {
        if (!Enum.TryParse<ItemState>(dto.State, true, out var state))
            return BadRequest("Invalid state value.");

        var success = await repo.PatchStateAsync(sku, state);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{sku}")]
    public async Task<IActionResult> Delete(string sku)
    {
        var success = await repo.DeleteAsync(sku);
        return success ? NoContent() : NotFound();
    }

    [HttpPost("{sku}/image")]
    public async Task<IActionResult> UploadImage(string sku, IFormFile file)
    {
        if (file.Length == 0) return BadRequest("No file provided.");

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext)) return BadRequest("Unsupported image format.");

        var imagesDir = Path.Combine(env.WebRootPath ?? env.ContentRootPath, "images");
        Directory.CreateDirectory(imagesDir);

        var fileName = $"{sku}{ext}";
        var filePath = Path.Combine(imagesDir, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        var imageUrl = $"/images/{fileName}";
        var item = await repo.GetBySkuAsync(sku);
        if (item is null) return NotFound();
        item.ImageUrl = imageUrl;
        await repo.UpdateAsync(sku, item);

        return Ok(new { imageUrl });
    }
}
