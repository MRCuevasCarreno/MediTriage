using System.Text.Json.Serialization;

namespace MediTriage.Api.Models;

public class Doctor
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Specialty { get; set; } = string.Empty;
    public string? Center { get; set; }
    [JsonIgnore] public User User { get; set; } = null!;
    [JsonIgnore] public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Sucursal> Sucursales { get; set; } = new List<Sucursal>();
}
