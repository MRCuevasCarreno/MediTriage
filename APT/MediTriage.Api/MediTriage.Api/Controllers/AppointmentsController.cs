using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AppointmentsController(AppDbContext db) => _db = db;

    // GET /api/appointments?doctorId=&patientId=&date=
    // Unificado: lista completa o filtrada por query params (evita conflicto en Swagger)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> Get(
        [FromQuery] int? doctorId,
        [FromQuery] int? patientId,
        [FromQuery] DateTime? date)
    {
        var q = _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .AsQueryable();

        if (doctorId.HasValue) q = q.Where(a => a.DoctorId == doctorId.Value);
        if (patientId.HasValue) q = q.Where(a => a.PatientId == patientId.Value);
        if (date.HasValue)
        {
            var d0 = date.Value.Date;
            var d1 = d0.AddDays(1);
            q = q.Where(a => a.Start >= d0 && a.Start < d1);
        }

        var list = await q
            .Select(a => new AppointmentDto
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
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Create([FromBody] AppointmentCreateDto request)
    {
        // TODO: agregar validaciones/chequeo de solapamientos si corresponde

        var entity = new Appointment
        {
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            Start = request.Start,
            End = request.End,
            TriageLevel = request.TriageLevel,
            TriageNotes = request.TriageNotes
        };

        _db.Appointments.Add(entity);
        await _db.SaveChangesAsync();

        var dto = await _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Where(a => a.Id == entity.Id)
            .Select(a => new AppointmentDto
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
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatusUpdateDto body)
    {
        var appt = await _db.Appointments.FindAsync(id);
        if (appt is null)
            return NotFound(new { error = "NotFound", message = "Cita no encontrada." });

        if (!Enum.IsDefined(typeof(AppointmentStatus), body.Status))
            return BadRequest(new { error = "InvalidStatus", message = "Estado inválido." });

        var prev = appt.Status;
        var next = (AppointmentStatus)body.Status;

        // Regla de negocio de ejemplo
        if (prev == AppointmentStatus.Cancelled && next == AppointmentStatus.Completed)
            return BadRequest(new
            {
                error = "InvalidTransition",
                message = "No se puede completar una cita cancelada.",
                currentStatus = StatusToString(prev),
                requestedStatus = StatusToString(next)
            });

        appt.Status = next;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = appt.Id,
            previousStatus = StatusToString(prev),
            newStatus = StatusToString(next),
            message = BuildStatusMessage(next)
        });
    }

    // === Helpers (puedes dejarlos al final del controlador) ===
    private static string StatusToString(AppointmentStatus s) => s.ToString();
    // Si quieres nombres en español, cambia el mapping aquí:
    // return s switch
    // {
    //     AppointmentStatus.Scheduled => "Programada",
    //     AppointmentStatus.Completed => "Completada",
    //     AppointmentStatus.Cancelled => "Cancelada",
    //     _ => s.ToString()
    // };

    private static string BuildStatusMessage(AppointmentStatus status) => status switch
    {
        AppointmentStatus.Cancelled => "Cita cancelada.",
        AppointmentStatus.Completed => "Cita marcada como completada.",
        AppointmentStatus.Scheduled => "Cita marcada como programada.",
        _ => "Estado actualizado."
    };


    [HttpPut("{id:int}/reschedule")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reschedule(int id, [FromBody] AppointmentRescheduleDto body)
    {
        var appt = await _db.Appointments.FindAsync(id);
        if (appt is null)
            return NotFound(new { error = "NotFound", message = "Cita no encontrada." });

        if (body.End <= body.Start)
            return BadRequest(new { error = "InvalidRange", message = "Fin debe ser mayor que inicio." });

        if (!IsValidDuration(body.End - body.Start))
            return BadRequest(new { error = "InvalidDuration", message = "Duración debe estar entre 10 y 120 minutos." });

        if (!IsWithinWorkingHours(body.Start, body.End))
            return BadRequest(new { error = "OutOfWorkingHours", message = "Horario debe estar entre 08:00 y 20:00." });

        var overlaps = await _db.Appointments.AnyAsync(a =>
            a.Id != id &&
            a.DoctorId == appt.DoctorId &&
            a.Status == AppointmentStatus.Scheduled &&
            body.Start < a.End && body.End > a.Start
        );
        if (overlaps)
            return Conflict(new { error = "Overlap", message = "El doctor ya tiene una cita en ese rango." });

        var prevStart = appt.Start;
        var prevEnd = appt.End;

        appt.Start = body.Start;
        appt.End = body.End;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = appt.Id,
            previousStart = prevStart,
            previousEnd = prevEnd,
            newStart = appt.Start,
            newEnd = appt.End,
            message = "Cita reprogramada exitosamente."
        });
    }

    // GET /api/appointments/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> GetById(int id)
    {
        var a = await _db.Appointments
            .Include(x => x.Patient).ThenInclude(p => p.User)
            .Include(x => x.Doctor).ThenInclude(d => d.User)
            .Where(x => x.Id == id)
            .Select(a => new AppointmentDto
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
            })
            .FirstOrDefaultAsync();

        return a is null ? NotFound() : Ok(a);
    }

    private static bool IsWithinWorkingHours(DateTime start, DateTime end)
    {
        var startTime = start.TimeOfDay;
        var endTime = end.TimeOfDay;
        var open = new TimeSpan(8, 0, 0);   // 08:00
        var close = new TimeSpan(20, 0, 0); // 20:00
        return startTime >= open && endTime <= close;
    }

    private static bool IsValidDuration(TimeSpan duration)
    {
        return duration >= TimeSpan.FromMinutes(10) && duration <= TimeSpan.FromMinutes(120);
    }
}
