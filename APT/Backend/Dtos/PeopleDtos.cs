namespace MediTriage.Api.Dtos;

public class PatientListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}

public class DoctorListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Specialty { get; set; } = null!;
}
