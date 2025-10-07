public class DoctorDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Specialty { get; set; } = string.Empty;
    public string? Center { get; set; }
    public UserDto User { get; set; } = new();
}       