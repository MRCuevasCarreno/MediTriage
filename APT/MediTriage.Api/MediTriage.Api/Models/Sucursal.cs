using System.ComponentModel.DataAnnotations;
using MediTriage.Api.Models;

public class Sucursal
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Direccion { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Comuna { get; set; } = string.Empty;

    // Relación: un doctor atiende en la sucursal
    public int? DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
}