namespace MediTriage.Api.Models;

public class Patient
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public User User { get; set; } = null!;
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
