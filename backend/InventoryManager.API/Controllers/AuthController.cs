using Google.Apis.Auth;
using InventoryManager.Core.DTOs;
using InventoryManager.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace InventoryManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IConfiguration config, IInvestorRepository investors, IScoutRepository scouts) : ControllerBase
{
    [HttpGet("config")]
    [AllowAnonymous]
    public IActionResult GetConfig() =>
        Ok(new { googleClientId = config["Auth:GoogleClientId"] ?? "" });

    /// <summary>Employee (owner) login — only accepts the configured owner email.</summary>
    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
            return BadRequest(new { error = "idToken is required." });

        var payload = await ValidateGoogleToken(dto.IdToken);
        if (payload is null)
            return Unauthorized(new { error = "Invalid or expired Google token." });

        var ownerEmail = config["Auth:OwnerEmail"] ?? "";
        if (!string.Equals(payload.Email, ownerEmail, StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { error = "Access denied." });

        return Ok(new { token = BuildJwt([new Claim("role", "owner")]) });
    }

    /// <summary>Investor login — accepts any email registered in the Investors table.</summary>
    [HttpPost("investor/google")]
    [AllowAnonymous]
    public async Task<IActionResult> InvestorGoogleSignIn([FromBody] GoogleSignInDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
            return BadRequest(new { error = "idToken is required." });

        var payload = await ValidateGoogleToken(dto.IdToken);
        if (payload is null)
            return Unauthorized(new { error = "Invalid or expired Google token." });

        var investor = await investors.GetByEmailAsync(payload.Email);
        if (investor is null)
            return Unauthorized(new { error = "No investor account found for this Google account." });

        return Ok(new
        {
            token = BuildJwt([
                new Claim("role", "investor"),
                new Claim("investor_id", investor.Id.ToString()),
            ])
        });
    }

    /// <summary>Scout login — accepts any email registered in the Scouts table.</summary>
    [HttpPost("scout/google")]
    [AllowAnonymous]
    public async Task<IActionResult> ScoutGoogleSignIn([FromBody] GoogleSignInDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
            return BadRequest(new { error = "idToken is required." });

        var payload = await ValidateGoogleToken(dto.IdToken);
        if (payload is null)
            return Unauthorized(new { error = "Invalid or expired Google token." });

        var scout = await scouts.GetByEmailAsync(payload.Email);
        if (scout is null)
            return Unauthorized(new { error = "No scout account found for this Google account." });

        return Ok(new
        {
            token = BuildJwt([
                new Claim("role", "scout"),
                new Claim("scout_id", scout.Id.ToString()),
            ])
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<GoogleJsonWebSignature.Payload?> ValidateGoogleToken(string idToken)
    {
        try
        {
            return await GoogleJsonWebSignature.ValidateAsync(idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [config["Auth:GoogleClientId"]!]
                });
        }
        catch { return null; }
    }

    private string BuildJwt(IEnumerable<Claim> extraClaims)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Auth:JwtSecret"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(config.GetValue<int>("Auth:JwtExpiryHours", 168));

        var token = new JwtSecurityToken(
            issuer:             "inventory.sashashkurkin.com",
            audience:           "inventory.sashashkurkin.com",
            claims:             extraClaims,
            expires:            expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
