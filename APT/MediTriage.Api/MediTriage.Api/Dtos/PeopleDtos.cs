namespace MediTriage.Api.Dtos
{
    public class PatientListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Email { get; set; }   // 👈 agregado
    }

    public class DoctorListDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }   // ya lo tenías
        public string Name { get; set; } = null!;
        public string Specialty { get; set; } = null!;
        public string Email { get; set; } = null!;
        public List<SucursalSimpleDto> Sucursal { get; set; } = new();
    }
}
