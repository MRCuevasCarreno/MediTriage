namespace MediTriage.Api.Dtos;

public class AppointmentCreateDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public string? TriageLevel { get; set; } // "LOW" | "MEDIUM" | "HIGH"
    public string? TriageNotes { get; set; }
}
