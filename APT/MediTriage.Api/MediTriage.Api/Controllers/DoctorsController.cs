using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DoctorsController(AppDbContext db) => _db = db;

    [HttpGet]
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
