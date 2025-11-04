namespace MediTriage.Api.Dtos;

public class ProfileDto
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string? FullName { get; set; }
    public string? Rut { get; set; }
    public string? PhotoUrl { get; set; }
    public string Role { get; set; } = null!;
}
