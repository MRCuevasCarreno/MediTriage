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
            .Select(d => new DoctorListDto { Id = d.Id, UserId = d.UserId, Name = d.User.Name, Specialty = d.Specialty, Email = d.User.Email })
            .FirstOrDefaultAsync();

        return dto is null
            ? StatusCode(StatusCodes.Status404NotFound, new ErrorResponse("NotFound", "Doctor no encontrado."))
            : Ok(new SuccessResponse<DoctorListDto>(dto, "Doctor actual."));
    }


    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> Get([FromQuery] PaginationQuery query, [FromQuery] string? name)
    {
        var q = _db.Doctors
            .Include(d => d.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var nameLower = name.Trim().ToLower();
            q = q.Where(d => d.User.Name.ToLower().Contains(nameLower));
        }

        var sortBy = (query.SortBy ?? "name").ToLowerInvariant();
        var desc = string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        q = sortBy switch
        {
            "name" => desc ? q.OrderByDescending(d => d.User.Name) : q.OrderBy(d => d.User.Name),
            "specialty" => desc ? q.OrderByDescending(d => d.Specialty) : q.OrderBy(d => d.Specialty),
            "id" => desc ? q.OrderByDescending(d => d.Id) : q.OrderBy(d => d.Id),
            _ => desc ? q.OrderByDescending(d => d.User.Name) : q.OrderBy(d => d.User.Name),
        };

        var total = await q.CountAsync();

        var data = await q
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(d => new DoctorListDto { Id = d.Id, UserId = d.UserId, Name = d.User.Name, Specialty = d.Specialty, Email = d.User.Email })
            .ToListAsync();

        return Ok(new SuccessResponse<PagedResponse<DoctorListDto>>(
            new PagedResponse<DoctorListDto>(data, query.PageNumber, query.PageSize, total),
            "Listado de doctores (paginado)."));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetById(int id)
    {
        var d = await _db.Doctors.Include(x => x.User)
            .Where(x => x.Id == id)
            .Select(x => new DoctorListDto { Id = x.Id, Name = x.User.Name, Specialty = x.Specialty, Email = x.User.Email })
            .FirstOrDefaultAsync();

        return d is null
            ? Error(StatusCodes.Status404NotFound, "NotFound", "Doctor no encontrado.")
            : Success(d, "Doctor encontrado.");
    }

    [HttpPost("calendar")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetCalendar([FromBody] DoctorCalendarRequest request)
    {
        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.Id);

        if (doctor == null)
            return NotFound(new { data = (object?)null, message = "Doctor no encontrado." });

        var date = request.Date.Date;
        var startHour = new DateTime(date.Year, date.Month, date.Day, 9, 0, 0, DateTimeKind.Utc);
        var endHour = new DateTime(date.Year, date.Month, date.Day, 20, 0, 0, DateTimeKind.Utc);

        var slots = new List<AppointmentSlotDto>();
        var notAvailable = new List<AppointmentNotAvailableDto>();

        // Obtener citas agendadas para ese doctor en ese día
        var appointments = await _db.Appointments
            .Where(a => a.DoctorId == doctor.Id && a.Start.Date == date && a.Status == AppointmentStatus.Scheduled)
            .ToListAsync();

        for (var dt = startHour; dt < endHour; dt = dt.AddMinutes(30))
        {
            var slotStart = dt;
            var slotEnd = dt.AddMinutes(29).AddSeconds(59);

            var appointment = appointments.FirstOrDefault(a =>
                a.Start < slotEnd && a.End > slotStart
            );

            bool isAvailable = appointment == null;

            slots.Add(new AppointmentSlotDto
            {
                AppointmentID = appointment?.Id,
                StartHour = slotStart,
                FinishHour = slotEnd,
                Status = isAvailable
            });

            if (!isAvailable)
            {
                notAvailable.Add(new AppointmentNotAvailableDto
                {
                    AppointmentID = appointment?.Id, // <-- Asigna el ID aquí
                    Hour = slotStart,
                    Status = false
                });
            }
        }

        var response = new DoctorCalendarResponse
        {
            Id = doctor.Id,
            Name = doctor.User.Name,
            Specialty = doctor.Specialty,
            AppointmentsAvailable = slots.Where(s => s.Status).ToList(),
            AppointmentsNotAvalable = notAvailable
        };

        return Ok(new { data = response, message = "Citas encontradas." });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> CreateDoctor([FromBody] DoctorCreateDto dto)
    {
        // Validación básica
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Specialty) || string.IsNullOrWhiteSpace(dto.Email))
            return Error(StatusCodes.Status400BadRequest, "InvalidInput", "Todos los campos son obligatorios.");

        // Validar especialidad
        var allowedSpecialties = new[] { "Medicina General", "Dermatología", "Cardiología", "Pediatría", "Kinesiología" };
        if (!allowedSpecialties.Contains(dto.Specialty))
            return Error(StatusCodes.Status400BadRequest, "InvalidSpecialty", "Especialidad no permitida.");

        // Validar email único
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Error(StatusCodes.Status400BadRequest, "EmailExists", "El email ya está registrado.");

        // Crear usuario
        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = email,
            Role = UserRole.Doctor,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")) // Password aleatoria
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Crear doctor
        var doctor = new Doctor
        {
            UserId = user.Id,
            Specialty = dto.Specialty
        };
        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();

        // Respuesta
        var result = new
        {
            id = user.Id,
            userId = doctor.Id,
            name = user.Name,
            specialty = doctor.Specialty,
            email = user.Email
        };

        return StatusCode(StatusCodes.Status201Created,
            new SuccessResponse<object>(new[] { result }, "Doctor creado exitosamente."));
    }

    public class DoctorDeleteDto
    {
        public int Id { get; set; }      // id usuario
        public int UserId { get; set; }  // id doctor
    }

    [HttpDelete]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteDoctor([FromBody] DoctorDeleteDto dto)
    {
        // Buscar doctor y usuario asociados
        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == dto.UserId && d.UserId == dto.Id);

        if (doctor == null)
            return Error(StatusCodes.Status404NotFound, "NotFound", "Doctor no encontrado.");

        // Guardar datos para la respuesta antes de eliminar
        var result = new
        {
            id = doctor.User.Id,
            userId = doctor.Id,
            name = doctor.User.Name,
            specialty = doctor.Specialty,
            email = doctor.User.Email
        };

        // Eliminar doctor y usuario
        _db.Doctors.Remove(doctor);
        _db.Users.Remove(doctor.User);
        await _db.SaveChangesAsync();

        return Ok(new SuccessResponse<object>(new[] { result }, "Doctor Eliminado exitosamente."));
    }

    // Helpers locales
    private ObjectResult Error(int statusCode, string code, string message, object? data = null)
        => StatusCode(statusCode, new ErrorResponse(code, message, data));

    private OkObjectResult Success<T>(T data, string message)
        => Ok(new SuccessResponse<T>(data, message));
}
