using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediTriage.Api.Data;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Models;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeController : ControllerBase
{
    private readonly AppDbContext _db;

    public MeController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get()
    {
        var userIdStr = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { error = "Usuario no válido" });

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return Unauthorized(new { error = "Usuario no encontrado" });

        var response = new
        {
            id = user.Id,
            email = user.Email,
            name = user.Name,
            role = user.Role.ToString(),
            patientId = user.Role == UserRole.Patient
                ? await _db.Patients
                    .Where(p => p.Id == user.Id)
                    .Select(p => (int?)p.Id)
                    .FirstOrDefaultAsync()
                : null
        };

        return Ok(response);
    }
}
