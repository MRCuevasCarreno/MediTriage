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
[Authorize(Roles = "Doctor,Admin")]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PatientsController(AppDbContext db) => _db = db;


    [HttpGet("me")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult> GetMyPatient()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(sub, out var userId))
            return StatusCode(StatusCodes.Status401Unauthorized, new ErrorResponse("Unauthorized", "Usuario no válido."));

        var dto = await _db.Patients
            .Include(p => p.User)
            .Where(p => p.UserId == userId)
            .Select(p => new PatientListDto { Id = p.Id, Name = p.User.Name })
            .FirstOrDefaultAsync();

        return dto is null
            ? StatusCode(StatusCodes.Status404NotFound, new ErrorResponse("NotFound", "Paciente no encontrado."))
            : Ok(new SuccessResponse<PatientListDto>(dto, "Paciente actual."));
    }


    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> Get()
    {
        var list = await _db.Patients
            .Include(p => p.User)
            .Select(p => new PatientListDto { Id = p.Id, Name = p.User.Name })
            .ToListAsync();

        return Success(list, "Listado de pacientes.");
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetById(int id)
    {
        var p = await _db.Patients.Include(x => x.User)
            .Where(x => x.Id == id)
            .Select(x => new PatientListDto { Id = x.Id, Name = x.User.Name })
            .FirstOrDefaultAsync();

        return p is null
            ? Error(StatusCodes.Status404NotFound, "NotFound", "Paciente no encontrado.")
            : Success(p, "Paciente encontrado.");
    }

    // Helpers locales
    private ObjectResult Error(int statusCode, string code, string message, object? data = null)
        => StatusCode(statusCode, new ErrorResponse(code, message, data));

    private OkObjectResult Success<T>(T data, string message)
        => Ok(new SuccessResponse<T>(data, message));

    private int? GetUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }

    private string? GetRole() => User.FindFirst(ClaimTypes.Role)?.Value;

}
