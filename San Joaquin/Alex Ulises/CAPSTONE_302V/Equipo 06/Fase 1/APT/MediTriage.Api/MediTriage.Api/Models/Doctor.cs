namespace MediTriage.Api.Models;

public class Doctor
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Specialty { get; set; } = "Medicina General";
    public string? Center { get; set; }
    public User User { get; set; } = null!;
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
