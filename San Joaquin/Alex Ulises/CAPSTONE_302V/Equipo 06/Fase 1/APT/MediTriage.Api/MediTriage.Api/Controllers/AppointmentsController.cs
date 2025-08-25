using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Dtos;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AppointmentsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> Get()
    {
        var list = await _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
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
    public async Task<ActionResult<Appointment>> Create([FromBody] AppointmentCreateDto request)
    {
        if (request.End <= request.Start)
            return BadRequest("La hora de término debe ser mayor que la de inicio.");

        // (valida existencia de FK)
        var patientExists = await _db.Patients.AnyAsync(p => p.Id == request.PatientId);
        var doctorExists = await _db.Doctors.AnyAsync(d => d.Id == request.DoctorId);
        if (!patientExists || !doctorExists)
            return BadRequest("PatientId o DoctorId no existen.");

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
        return CreatedAtAction(nameof(Get), new { id = entity.Id },
        await _db.Appointments
        .Include(a => a.Patient).ThenInclude(p => p.User)
        .Include(a => a.Doctor).ThenInclude(d => d.User)
        .FirstAsync(a => a.Id == entity.Id));
    }
}
