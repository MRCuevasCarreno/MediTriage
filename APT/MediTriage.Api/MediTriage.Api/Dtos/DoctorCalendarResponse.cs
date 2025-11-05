public class DoctorCalendarResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Specialty { get; set; } = default!;
    public List<AppointmentSlotDto> AppointmentsAvailable { get; set; } = new();
    public List<DoctorCalendarAppointmentDto> AppointmentsNotAvalable { get; set; } = new();
}