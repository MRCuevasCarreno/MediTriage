public class DoctorCalendarAppointmentDto
{
    public int AppointmentID { get; set; }
    public DateTime Hour { get; set; }
    public bool Status { get; set; }
    public string? Rut { get; set; }           
    public string? TriageLevel { get; set; }   
    public string? TriageNotes { get; set; }   
    public string? FullNamePatient { get; set; } 
}