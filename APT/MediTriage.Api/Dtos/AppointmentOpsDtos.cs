namespace MediTriage.Api.Dtos;

public class AppointmentStatusUpdateDto
{
    public int Status { get; set; } // 0=Scheduled,1=Completed,2=Cancelled
}

public class AppointmentRescheduleDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}
