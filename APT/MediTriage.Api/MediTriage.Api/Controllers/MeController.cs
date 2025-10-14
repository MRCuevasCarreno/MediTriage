using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediTriage.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly AppDbContext _db;

    public MeController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult> Get()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue(ClaimTypes.Name)
                    ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        int.TryParse(userIdStr, out var userId);

        // doctorId como int? para permitir null
        int? doctorId = await _db.Doctors
            .Where(d => d.UserId == userId)
            .Select(d => (int?)d.Id) // <-- casteo explícito a int?
            .FirstOrDefaultAsync();

        return Ok(new
        {
            id = userIdStr,
            doctorId, // Si no existe, será null
            email = User.FindFirstValue(ClaimTypes.Email),
            name = User.FindFirstValue(ClaimTypes.Name),
            role = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}
