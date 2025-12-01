public class DoctorCalendarAppointmentDto
{
    public int AppointmentID { get; set; }
    public DateTime Hour { get; set; }
    public bool Status { get; set; }
    public string? Rut { get; set; }           // Nuevo campo
    public string? TriageLevel { get; set; }   // Nuevo campo
    public string? TriageNotes { get; set; }   // Nuevo campo
    public string? FullNamePatient { get; set; } // <-- Agregado
}