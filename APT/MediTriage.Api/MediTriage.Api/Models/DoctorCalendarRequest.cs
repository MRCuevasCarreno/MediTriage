public class DoctorCalendarRequest
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
}

public class AppointmentSlotDto
{
    public int? AppointmentID { get; set; } // <-- Nuevo campo
    public DateTime StartHour { get; set; }
    public DateTime FinishHour { get; set; }
    public bool Status { get; set; }
}

public class AppointmentNotAvailableDto
{
    public int? AppointmentID { get; set; } // <-- Nuevo campo
    public DateTime Hour { get; set; }
    public bool Status { get; set; }
}

public class DoctorCalendarResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public List<AppointmentSlotDto> AppointmentsAvailable { get; set; } = new();
    public List<AppointmentNotAvailableDto> AppointmentsNotAvalable { get; set; } = new();
}