using MediTriage.Api.Dtos;
using System.Collections.Generic;

public class SucursalDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Comuna { get; set; } = string.Empty;
    public List<DoctorDto> Doctors { get; set; } = new();
}