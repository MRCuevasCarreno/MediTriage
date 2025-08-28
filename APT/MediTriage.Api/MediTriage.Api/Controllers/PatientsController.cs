using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PatientsController(AppDbContext db) => _db = db;

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
}
