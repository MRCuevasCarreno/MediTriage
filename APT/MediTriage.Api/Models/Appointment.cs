namespace MediTriage.Api.Models;

public enum AppointmentStatus
{
    Scheduled = 0,
    Completed = 1,
    Cancelled = 2
}

public class Appointment
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

    // Campos de triage (MVP)
    public string? TriageLevel { get; set; }   // LOW | MEDIUM | HIGH
    public string? TriageNotes { get; set; }

    public Patient Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
}
