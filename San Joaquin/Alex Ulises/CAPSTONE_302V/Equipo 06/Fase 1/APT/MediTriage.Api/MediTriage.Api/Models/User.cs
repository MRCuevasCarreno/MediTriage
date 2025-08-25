using System.Numerics;

namespace MediTriage.Api.Models;

public enum UserRole { Patient, Doctor, Admin }

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    // (Más adelante: PasswordHash, etc.)
    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
}
