using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SucursalesController : ControllerBase
{
    private readonly AppDbContext _db;
    public SucursalesController(AppDbContext db) => _db = db;

    // GET: api/sucursales
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> Get()
    {
        var sucursales = await _db.Sucursales
            .Include(s => s.Doctors)
                .ThenInclude(d => d.User)
            .Select(s => new SucursalDto
            {
                Id = s.Id,
                Nombre = s.Nombre,
                Direccion = s.Direccion,
                Comuna = s.Comuna,
                Doctors = s.Doctors.Select(d => new DoctorDto
                {
                    Id = d.Id,
                    UserId = d.UserId,
                    Specialty = d.Specialty,
                    Center = d.Center,
                    User = new UserDto
                    {
                        Id = d.User.Id,
                        Name = d.User.Name,
                        Email = d.User.Email,
                        Role = d.User.Role.ToString()
                    }
                }).ToList()
            })
            .ToListAsync();

        return Success(sucursales, "Listado de sucursales.");
    }

    // POST: api/sucursales
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Create([FromBody] SucursalCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return Error(StatusCodes.Status400BadRequest, "InvalidName", "El nombre es requerido.");
        if (string.IsNullOrWhiteSpace(dto.Direccion))
            return Error(StatusCodes.Status400BadRequest, "InvalidAddress", "La dirección es requerida.");
        if (string.IsNullOrWhiteSpace(dto.Comuna))
            return Error(StatusCodes.Status400BadRequest, "InvalidComuna", "La comuna es requerida.");

        var sucursal = new Sucursal
        {
            Nombre = dto.Nombre.Trim(),
            Direccion = dto.Direccion.Trim(),
            Comuna = dto.Comuna.Trim()
        };
        _db.Sucursales.Add(sucursal);
        await _db.SaveChangesAsync();

        var result = new SucursalDto
        {
            Id = sucursal.Id,
            Nombre = sucursal.Nombre,
            Direccion = sucursal.Direccion,
            Comuna = sucursal.Comuna,
            Doctors = new List<DoctorDto>()
        };

        return CreatedAtAction(nameof(Get), new { id = sucursal.Id }, new SuccessResponse<SucursalDto>(result, "Sucursal creada exitosamente."));
    }

    // DELETE: api/sucursales/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var sucursal = await _db.Sucursales.FindAsync(id);
        if (sucursal == null)
            return Error(StatusCodes.Status404NotFound, "NotFound", "Sucursal no encontrada.");

        _db.Sucursales.Remove(sucursal);
        await _db.SaveChangesAsync();
        return Success(new { id }, "Sucursal eliminada correctamente.");
    }

    // POST: api/sucursales/assignDoctor
    [HttpPost("assignDoctor")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignDoctor([FromBody] SucursalAssignDoctorDto dto)
    {
        if (dto.IdDoctor <= 0 || dto.IdSucursal <= 0)
            return Error(StatusCodes.Status400BadRequest, "InvalidInput", "IdDoctor e IdSucursal deben ser válidos.");

        var sucursal = await _db.Sucursales
            .Include(s => s.Doctors)
            .FirstOrDefaultAsync(s => s.Id == dto.IdSucursal);
        if (sucursal == null)
            return Error(StatusCodes.Status404NotFound, "SucursalNotFound", "Sucursal no encontrada.");

        var doctor = await _db.Doctors.FindAsync(dto.IdDoctor);
        if (doctor == null)
            return Error(StatusCodes.Status404NotFound, "DoctorNotFound", "Doctor no encontrado.");

        if (!sucursal.Doctors.Any(d => d.Id == doctor.Id))
            sucursal.Doctors.Add(doctor);

        await _db.SaveChangesAsync();

        var response = new[]
        {
            new
            {
                idDoctor = dto.IdDoctor,
                idSucursal = dto.IdSucursal,
                nombre = sucursal.Nombre,
                direccion = sucursal.Direccion,
                comuna = sucursal.Comuna
            }
        };

        return Success(response, "Doctor asignado a Sucursal.");
    }

    // Helpers
    private ObjectResult Error(int statusCode, string code, string message, object? data = null)
        => StatusCode(statusCode, new ErrorResponse(code, message, data));

    private OkObjectResult Success<T>(T data, string message)
        => Ok(new SuccessResponse<T>(data, message));
}