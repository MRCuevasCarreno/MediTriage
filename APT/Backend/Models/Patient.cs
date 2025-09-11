using System.Text.Json.Serialization;

namespace MediTriage.Api.Models;

public class Patient
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime? DateOfBirth { get; set; }
    [JsonIgnore] public User User { get; set; } = null!;
    [JsonIgnore] public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();



}
