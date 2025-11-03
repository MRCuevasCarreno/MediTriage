namespace MediTriage.Api.Dtos;

public class AppointmentCreateDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public string? Rut { get; set; }           // Campo opcional agregado
    public string? TriageLevel { get; set; }
    public string? TriageNotes { get; set; }
}

public class AppointmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = null!;
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = null!;
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public string? Rut { get; set; }           // Campo opcional agregado
    public string? TriageLevel { get; set; }
    public string? TriageNotes { get; set; }
}
