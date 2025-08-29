using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt; // para JwtRegisteredClaimNames.Sub


namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DoctorsController(AppDbContext db) => _db = db;


    [HttpGet("me")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<ActionResult> GetMyDoctor()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(sub, out var userId))
            return StatusCode(StatusCodes.Status401Unauthorized, new ErrorResponse("Unauthorized", "Usuario no válido."));

        var dto = await _db.Doctors
            .Include(d => d.User)
            .Where(d => d.UserId == userId)
            .Select(d => new DoctorListDto { Id = d.Id, Name = d.User.Name, Specialty = d.Specialty })
            .FirstOrDefaultAsync();

        return dto is null
            ? StatusCode(StatusCodes.Status404NotFound, new ErrorResponse("NotFound", "Doctor no encontrado."))
            : Ok(new SuccessResponse<DoctorListDto>(dto, "Doctor actual."));
    }


    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> Get()
    {
        var list = await _db.Doctors
            .Include(d => d.User)
            .Select(d => new DoctorListDto { Id = d.Id, Name = d.User.Name, Specialty = d.Specialty })
            .ToListAsync();

        return Success(list, "Listado de doctores.");
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetById(int id)
    {
        var d = await _db.Doctors.Include(x => x.User)
            .Where(x => x.Id == id)
            .Select(x => new DoctorListDto { Id = x.Id, Name = x.User.Name, Specialty = x.Specialty })
            .FirstOrDefaultAsync();

        return d is null
            ? Error(StatusCodes.Status404NotFound, "NotFound", "Doctor no encontrado.")
            : Success(d, "Doctor encontrado.");
    }

    // Helpers locales
    private ObjectResult Error(int statusCode, string code, string message, object? data = null)
        => StatusCode(statusCode, new ErrorResponse(code, message, data));

    private OkObjectResult Success<T>(T data, string message)
        => Ok(new SuccessResponse<T>(data, message));
}
