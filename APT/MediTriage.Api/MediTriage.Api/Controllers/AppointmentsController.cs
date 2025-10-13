using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Text;

namespace MediTriage.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _hfToken;

    public AppointmentsController(AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _hfToken = configuration["HuggingFace:Token"];
    }

    // POST /api/appointments/public  (SIN AUTENTICACIÓN)
    [HttpPost("public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
    public async Task<ActionResult> CreatePublic([FromBody] PublicAppointmentCreateDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return Error(StatusCodes.Status400BadRequest, "InvalidName", "FullName es requerido.");
        if (string.IsNullOrWhiteSpace(request.Email))
            return Error(StatusCodes.Status400BadRequest, "InvalidEmail", "Email es requerido.");

        var email = request.Email.Trim().ToLowerInvariant();

        if (request.End <= request.Start)
            return Error(StatusCodes.Status400BadRequest, "InvalidRange", "Fin debe ser mayor que inicio.");

        var duration = request.End - request.Start;
        if (!IsValidDuration(duration))
            return Error(StatusCodes.Status400BadRequest, "InvalidDuration", "Duración debe estar entre 10 y 120 minutos.");

        if (!IsWithinWorkingHours(request.Start, request.End))
            return Error(StatusCodes.Status400BadRequest, "OutOfWorkingHours", "Horario debe estar entre 08:00 y 20:00.");

        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId);

        if (doctor is null)
            return Error(StatusCodes.Status404NotFound, "DoctorNotFound", "El doctor especificado no existe.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            user = new User
            {
                Email = email,
                Name = request.FullName.Trim(),
                Role = UserRole.Patient,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"))
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else
        {
            var newName = request.FullName.Trim();
            if (!string.IsNullOrEmpty(newName) && !string.Equals(user.Name, newName, StringComparison.Ordinal))
            {
                user.Name = newName;
                _db.Users.Update(user);
                await _db.SaveChangesAsync();
            }
        }

        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        if (patient is null)
        {
            patient = new Patient { UserId = user.Id };
            _db.Patients.Add(patient);
            await _db.SaveChangesAsync();
        }

        var overlaps = await _db.Appointments.AnyAsync(a =>
            a.DoctorId == request.DoctorId &&
            a.Status == AppointmentStatus.Scheduled &&
            request.Start < a.End && request.End > a.Start
        );
        if (overlaps)
            return Error(StatusCodes.Status409Conflict, "Overlap", "El doctor ya tiene una cita en ese rango.");

        string? triage = null;
        if (!string.IsNullOrWhiteSpace(request.TriageLevel))
        {
            var v = request.TriageLevel.Trim().ToUpperInvariant();
            if (v is "1") v = "LOW";
            else if (v is "2") v = "MEDIUM";
            else if (v is "3") v = "HIGH";

            triage = v switch
            {
                "LOW" => "LOW",
                "MEDIUM" => "MEDIUM",
                "HIGH" => "HIGH",
                _ => null
            };

            if (triage is null)
                return Error(StatusCodes.Status400BadRequest, "InvalidTriage",
                    "TriageLevel debe ser LOW|MEDIUM|HIGH (o 1|2|3).");
        }

        var entity = new Appointment
        {
            PatientId = patient.Id,
            DoctorId = request.DoctorId,
            Start = request.Start,
            End = request.End,
            TriageLevel = triage,
            TriageNotes = request.TriageNotes,
            Status = AppointmentStatus.Scheduled
        };

        _db.Appointments.Add(entity);
        await _db.SaveChangesAsync();

        var dto = await _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Where(a => a.Id == entity.Id)
            .Select(a => ToDto(a))
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = dto.Id },
            new SuccessResponse<AppointmentDto>(dto, "Cita creada exitosamente (pública)."));
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> Get(
    [FromQuery] int? doctorId,
    [FromQuery] int? patientId,
    [FromQuery] DateTime? date,
    [FromQuery] PaginationQuery query)
    {
        var role = GetRole();
        var userId = GetUserId();
        if (userId is null) return Error(StatusCodes.Status401Unauthorized, "Unauthorized", "Usuario no válido.");

        var q = _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .AsQueryable();

        if (role == "Doctor")
        {
            q = q.Where(a => a.Doctor.UserId == userId);
        }
        else if (role == "Patient")
        {
            q = q.Where(a => a.Patient.UserId == userId);
        }

        if (doctorId.HasValue) q = q.Where(a => a.DoctorId == doctorId.Value);
        if (patientId.HasValue) q = q.Where(a => a.PatientId == patientId.Value);
        if (date.HasValue)
        {
            var d0 = date.Value.Date;
            var d1 = d0.AddDays(1);
            q = q.Where(a => a.Start >= d0 && a.Start < d1);
        }

        var list = await q.Select(a => ToDto(a)).ToListAsync();
        return Success(list, "Listado de citas.");
    }

    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetById(int id)
    {
        var role = GetRole();
        var userId = GetUserId();
        if (userId is null) return Error(StatusCodes.Status401Unauthorized, "Unauthorized", "Usuario no válido.");

        var q = _db.Appointments
            .Include(x => x.Patient).ThenInclude(p => p.User)
            .Include(x => x.Doctor).ThenInclude(d => d.User)
            .Where(x => x.Id == id);

        if (role == "Doctor")
            q = q.Where(a => a.Doctor.UserId == userId);
        else if (role == "Patient")
            q = q.Where(a => a.Patient.UserId == userId);

        var dto = await q.Select(a => ToDto(a)).FirstOrDefaultAsync();

        return dto is null
            ? Error(StatusCodes.Status404NotFound, "NotFound", "Cita no encontrada o sin permisos.")
            : Success(dto, "Cita encontrada.");
    }

    [HttpPost]
    [Authorize(Roles = "Patient,Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Create([FromBody] AppointmentCreateDto request)
    {
        if (request.End <= request.Start)
            return Error(StatusCodes.Status400BadRequest, "InvalidRange", "Fin debe ser mayor que inicio.");

        var duration = request.End - request.Start;
        if (!IsValidDuration(duration))
            return Error(StatusCodes.Status400BadRequest, "InvalidDuration", "Duración debe estar entre 10 y 120 minutos.");

        if (!IsWithinWorkingHours(request.Start, request.End))
            return Error(StatusCodes.Status400BadRequest, "OutOfWorkingHours", "Horario debe estar entre 08:00 y 20:00.");

        var role = GetRole();
        if (role == "Patient")
        {
            var userId = GetUserId();
            if (userId is null) return Error(StatusCodes.Status401Unauthorized, "Unauthorized", "Usuario no válido.");

            var myPatientId = await _db.Patients.Where(p => p.UserId == userId).Select(p => p.Id).FirstOrDefaultAsync();
            if (myPatientId == 0 || myPatientId != request.PatientId)
                return Error(StatusCodes.Status403Forbidden, "Forbidden", "No puedes crear citas para otros pacientes.");
        }

        var overlaps = await _db.Appointments.AnyAsync(a =>
            a.DoctorId == request.DoctorId &&
            a.Status == AppointmentStatus.Scheduled &&
            request.Start < a.End && request.End > a.Start
        );
        if (overlaps)
            return Error(StatusCodes.Status409Conflict, "Overlap", "El doctor ya tiene una cita en ese rango.");

        var entity = new Appointment
        {
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            Start = request.Start,
            End = request.End,
            TriageLevel = request.TriageLevel,
            TriageNotes = request.TriageNotes,
            Status = AppointmentStatus.Scheduled
        };

        _db.Appointments.Add(entity);
        await _db.SaveChangesAsync();

        var dto = await _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Where(a => a.Id == entity.Id)
            .Select(a => ToDto(a))
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = dto.Id },
            new SuccessResponse<AppointmentDto>(dto, "Cita creada exitosamente."));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Doctor,Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatusUpdateDto body)
    {
        var appt = await _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appt is null)
            return Error(StatusCodes.Status404NotFound, "NotFound", "Cita no encontrada.");

        if (GetRole() == "Doctor")
        {
            var userId = GetUserId();
            if (userId is null || appt.Doctor.UserId != userId)
                return Error(StatusCodes.Status403Forbidden, "Forbidden", "No puedes actualizar citas de otros doctores.");
        }

        if (!Enum.IsDefined(typeof(AppointmentStatus), body.Status))
            return Error(StatusCodes.Status400BadRequest, "InvalidStatus", "Estado inválido.");

        var prev = appt.Status;
        var next = (AppointmentStatus)body.Status;

        if (prev == AppointmentStatus.Cancelled && next == AppointmentStatus.Completed)
            return Error(StatusCodes.Status400BadRequest, "InvalidTransition",
                "No se puede completar una cita cancelada.",
                new { currentStatus = StatusToString(prev), requestedStatus = StatusToString(next) });

        appt.Status = next;
        await _db.SaveChangesAsync();

        return Success(new
        {
            id = appt.Id,
            previousStatus = StatusToString(prev),
            newStatus = StatusToString(next)
        }, BuildStatusMessage(next));
    }

    [HttpPut("{id:int}/reschedule")]
    [Authorize(Roles = "Patient,Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reschedule(int id, [FromBody] AppointmentRescheduleDto body)
    {
        var appt = await _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appt is null)
            return Error(StatusCodes.Status404NotFound, "NotFound", "Cita no encontrada.");

        if (GetRole() == "Patient")
        {
            var userId = GetUserId();
            if (userId is null || appt.Patient.UserId != userId)
                return Error(StatusCodes.Status403Forbidden, "Forbidden", "No puedes reagendar citas de otros pacientes.");
        }

        if (body.End <= body.Start)
            return Error(StatusCodes.Status400BadRequest, "InvalidRange", "Fin debe ser mayor que inicio.");

        var duration = body.End - body.Start;
        if (!IsValidDuration(duration))
            return Error(StatusCodes.Status400BadRequest, "InvalidDuration", "Duración debe estar entre 10 y 120 minutos.");

        if (!IsWithinWorkingHours(body.Start, body.End))
            return Error(StatusCodes.Status400BadRequest, "OutOfWorkingHours", "Horario debe estar entre 08:00 y 20:00.");

        var overlaps = await _db.Appointments.AnyAsync(a =>
            a.Id != id &&
            a.DoctorId == appt.DoctorId &&
            a.Status == AppointmentStatus.Scheduled &&
            body.Start < a.End && body.End > a.Start
        );
        if (overlaps)
            return Error(StatusCodes.Status409Conflict, "Overlap", "El doctor ya tiene una cita en ese rango.");

        var prevStart = appt.Start;
        var prevEnd = appt.End;

        appt.Start = body.Start;
        appt.End = body.End;
        await _db.SaveChangesAsync();

        return Success(new
        {
            id = appt.Id,
            previousStart = prevStart,
            previousEnd = prevEnd,
            newStart = appt.Start,
            newEnd = appt.End
        }, "Cita reprogramada exitosamente.");
    }

    // REPORTES --------------------------

    [HttpGet("reports/by-day")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<ActionResult> GetReportByDay()
    {
        var data = await _db.Appointments
            .GroupBy(a => a.Start.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .OrderBy(r => r.date)
            .ToListAsync();

        return Success(data, "Cantidad de citas agrupadas por día.");
    }

    [HttpGet("reports/by-doctor")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetReportByDoctor()
    {
        var data = await _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .GroupBy(a => a.Doctor.User.Name)
            .Select(g => new { doctorName = g.Key, count = g.Count() })
            .OrderByDescending(r => r.count)
            .ToListAsync();

        return Success(data, "Cantidad de citas agrupadas por doctor.");
    }

    [HttpGet("reports/by-status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetReportByStatus()
    {
        var data = await _db.Appointments
            .GroupBy(a => a.Status)
            .Select(g => new { status = g.Key.ToString(), count = g.Count() })
            .OrderBy(r => r.status)
            .ToListAsync();

        return Success(data, "Cantidad de citas agrupadas por estado.");
    }

    // Helpers
    private static AppointmentDto ToDto(Appointment a) => new()
    {
        Id = a.Id,
        PatientId = a.PatientId,
        PatientName = a.Patient.User.Name,
        DoctorId = a.DoctorId,
        DoctorName = a.Doctor.User.Name,
        Start = a.Start,
        End = a.End,
        TriageLevel = a.TriageLevel,
        TriageNotes = a.TriageNotes
    };

    private static bool IsWithinWorkingHours(DateTime start, DateTime end)
    {
        var startTime = start.TimeOfDay;
        var endTime = end.TimeOfDay;
        var open = new TimeSpan(8, 0, 0);
        var close = new TimeSpan(20, 0, 0);
        return startTime >= open && endTime <= close;
    }

    private static bool IsValidDuration(TimeSpan duration)
    {
        return duration >= TimeSpan.FromMinutes(10) && duration <= TimeSpan.FromMinutes(120);
    }

    private static string StatusToString(AppointmentStatus s) => s switch
    {
        AppointmentStatus.Scheduled => "Programada",
        AppointmentStatus.Completed => "Completada",
        AppointmentStatus.Cancelled => "Cancelada",
        _ => s.ToString()
    };

    private static string BuildStatusMessage(AppointmentStatus status) => status switch
    {
        AppointmentStatus.Cancelled => "Cita cancelada.",
        AppointmentStatus.Completed => "Cita marcada como completada.",
        AppointmentStatus.Scheduled => "Cita marcada como programada.",
        _ => "Estado actualizado."
    };

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