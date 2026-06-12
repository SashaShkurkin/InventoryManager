using AutoMapper;
using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController(IInventoryRepository repo, IMapper mapper) : ControllerBase
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
        var dtos = mapper.Map<List<InventoryItemDto>>(items);

        var firstImages = await repo.GetFirstImageIdsAsync(dtos.Select(d => d.Sku));
        foreach (var dto in dtos)
        {
            if (firstImages.TryGetValue(dto.Sku, out var imgId))
                dto.FirstImageId = imgId;
        }

        return Ok(new { total, page, pageSize, items = dtos });
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

        var dto = mapper.Map<InventoryItemDto>(item);
        var firstImages = await repo.GetFirstImageIdsAsync([sku]);
        if (firstImages.TryGetValue(sku, out var imgId))
            dto.FirstImageId = imgId;

        return Ok(dto);
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

    // ── Image endpoints ──────────────────────────────────────────────────────

    [HttpGet("{sku}/images")]
    public async Task<IActionResult> GetImages(string sku)
    {
        var images = await repo.GetImagesAsync(sku);
        return Ok(images);
    }

    [HttpGet("{sku}/images/{id:int}/data")]
    public async Task<IActionResult> GetImageData(string sku, int id)
    {
        var img = await repo.GetImageDataAsync(id);
        if (img is null || img.ItemSku != sku) return NotFound();
        return File(img.ImageData, img.ContentType);
    }

    [HttpPost("{sku}/images")]
    public async Task<IActionResult> UploadImage(string sku, IFormFile file)
    {
        if (file.Length == 0) return BadRequest("No file provided.");

        var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowed.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest("Unsupported image format.");

        var existing = (await repo.GetImagesAsync(sku)).ToList();
        if (existing.Count >= 6)
            return BadRequest("Maximum of 6 images per item.");

        var nextOrder = existing.Count > 0 ? existing.Max(i => i.SortOrder) + 1 : 0;

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var img = await repo.AddImageAsync(sku, ms.ToArray(), file.ContentType, nextOrder);
        return Ok(new ItemImageMetaDto { Id = img.Id, SortOrder = img.SortOrder });
    }

    [HttpDelete("{sku}/images/{id:int}")]
    public async Task<IActionResult> DeleteImage(string sku, int id)
    {
        var success = await repo.DeleteImageAsync(id);
        return success ? NoContent() : NotFound();
    }
}
