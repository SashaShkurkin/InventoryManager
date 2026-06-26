using AutoMapper;
using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkiaSharp;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController(IInventoryRepository repo, IMapper mapper) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? state,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        // Unauthenticated visitors may only browse Listed and PendingSale items
        if (!(User.Identity?.IsAuthenticated ?? false))
            state = "Listed,PendingSale";

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
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] string? state = null)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<SearchSuggestionDto>());

        var results = await repo.SearchSuggestionsAsync(q, state);
        return Ok(results);
    }

    [HttpGet("{sku}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySku(string sku)
    {
        var item = await repo.GetBySkuAsync(sku);
        if (item is null) return NotFound();

        // Public visitors may only view Listed and PendingSale items
        if (!(User.Identity?.IsAuthenticated ?? false) && item.State != ItemState.Listed && item.State != ItemState.PendingSale)
            return NotFound();

        var dto = mapper.Map<InventoryItemDto>(item);
        var firstImages = await repo.GetFirstImageIdsAsync([sku]);
        if (firstImages.TryGetValue(sku, out var imgId))
            dto.FirstImageId = imgId;

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Create([FromBody] CreateInventoryItemDto dto)
    {
        var item = mapper.Map<InventoryItem>(dto);
        var created = await repo.CreateAsync(item);
        return CreatedAtAction(nameof(GetBySku), new { sku = created.Sku }, mapper.Map<InventoryItemDto>(created));
    }

    [HttpPut("{sku}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Update(string sku, [FromBody] UpdateInventoryItemDto dto)
    {
        var item = mapper.Map<InventoryItem>(dto);
        var updated = await repo.UpdateAsync(sku, item);
        if (updated is null) return NotFound();
        return Ok(mapper.Map<InventoryItemDto>(updated));
    }

    [HttpPatch("{sku}/state")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> PatchState(string sku, [FromBody] PatchStateDto dto)
    {
        if (!Enum.TryParse<ItemState>(dto.State, true, out var state))
            return BadRequest("Invalid state value.");

        var success = await repo.PatchStateAsync(sku, state);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{sku}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> Delete(string sku)
    {
        var success = await repo.DeleteAsync(sku);
        return success ? NoContent() : NotFound();
    }

    // ── Image endpoints ──────────────────────────────────────────────────────

    [HttpGet("{sku}/images")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImages(string sku)
    {
        var images = await repo.GetImagesAsync(sku);
        return Ok(images);
    }

    [HttpGet("{sku}/images/{id:int}/data")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImageData(string sku, int id)
    {
        var img = await repo.GetImageDataAsync(id);
        if (img is null || img.ItemSku != sku) return NotFound();
        // Images are immutable by ID — browser caches indefinitely after first fetch
        Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";
        return File(img.ImageData, img.ContentType);
    }

    [HttpPost("{sku}/images")]
    [Authorize(Policy = "OwnerOnly")]
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

        // Resize to max 1200px on longest side, auto-rotate per EXIF, compress to JPEG 82%
        byte[] imageBytes;
        using (var inputStream = file.OpenReadStream())
        {
            using var ms = new MemoryStream();
            await inputStream.CopyToAsync(ms);
            var imageData = ms.ToArray();

            // Read EXIF orientation before decoding pixels — re-encoding strips EXIF,
            // so we must bake the rotation into the pixel data.
            SKEncodedOrigin origin = SKEncodedOrigin.TopLeft;
            using (var codec = SKCodec.Create(new SKMemoryStream(imageData)))
                if (codec is not null)
                    origin = codec.EncodedOrigin;

            using var decoded = SKBitmap.Decode(imageData);
            // ApplyExifOrientation always returns a new SKBitmap (safe to dispose independently)
            using var original = ApplyExifOrientation(decoded, origin);

            const int maxDim = 1200;
            SKBitmap bitmap;
            if (original.Width > maxDim || original.Height > maxDim)
            {
                float scale = Math.Min((float)maxDim / original.Width, (float)maxDim / original.Height);
                int newW = (int)(original.Width * scale);
                int newH = (int)(original.Height * scale);
                bitmap = original.Resize(new SKImageInfo(newW, newH), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
            }
            else
            {
                bitmap = original;
            }

            using var skImage = SKImage.FromBitmap(bitmap);
            using var data = skImage.Encode(SKEncodedImageFormat.Jpeg, 82);
            imageBytes = data.ToArray();

            if (!ReferenceEquals(bitmap, original)) bitmap.Dispose();
        }

        var img = await repo.AddImageAsync(sku, imageBytes, "image/jpeg", nextOrder);
        return Ok(new ItemImageMetaDto { Id = img.Id, SortOrder = img.SortOrder });
    }

    /// <summary>
    /// Returns a new SKBitmap with pixel data rotated/flipped to match the EXIF orientation tag.
    /// Always allocates a new bitmap so the caller can dispose it independently of <paramref name="src"/>.
    /// </summary>
    private static SKBitmap ApplyExifOrientation(SKBitmap src, SKEncodedOrigin origin)
    {
        // Orientations 5-8 swap width and height (90°/270° rotations)
        bool swapDims = origin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop
                                   or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;

        var result = new SKBitmap(swapDims ? src.Height : src.Width,
                                   swapDims ? src.Width  : src.Height);
        using var canvas = new SKCanvas(result);

        switch (origin)
        {
            case SKEncodedOrigin.TopRight:     // flip horizontal
                canvas.Translate(result.Width, 0);
                canvas.Scale(-1, 1);
                break;
            case SKEncodedOrigin.BottomRight:  // rotate 180°
                canvas.Translate(result.Width, result.Height);
                canvas.RotateDegrees(180);
                break;
            case SKEncodedOrigin.BottomLeft:   // flip vertical
                canvas.Translate(0, result.Height);
                canvas.Scale(1, -1);
                break;
            case SKEncodedOrigin.LeftTop:      // transpose (mirror + 90° CCW)
                canvas.Scale(1, -1);
                canvas.RotateDegrees(-90);
                break;
            case SKEncodedOrigin.RightTop:     // rotate 90° CW — most common (portrait phone)
                canvas.Translate(result.Width, 0);
                canvas.RotateDegrees(90);
                break;
            case SKEncodedOrigin.RightBottom:  // transverse (mirror + 90° CW)
                canvas.Scale(1, -1);
                canvas.Translate(0, -result.Height);
                canvas.RotateDegrees(90);
                break;
            case SKEncodedOrigin.LeftBottom:   // rotate 90° CCW
                canvas.Translate(0, result.Height);
                canvas.RotateDegrees(-90);
                break;
            // TopLeft (1) — no transform, just copy pixels through DrawBitmap below
        }

        canvas.DrawBitmap(src, 0, 0);
        return result;
    }

    [HttpDelete("{sku}/images/{id:int}")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> DeleteImage(string sku, int id)
    {
        var success = await repo.DeleteImageAsync(id);
        return success ? NoContent() : NotFound();
    }
}
