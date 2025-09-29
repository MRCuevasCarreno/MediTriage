using System.ComponentModel.DataAnnotations;

namespace MediTriage.Api.Models;

public enum UserRole { Patient, Doctor, Admin }

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = null!;

    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public UserRole Role { get; set; }

    // Nuevo: requerido para login
    [Required]
    public string PasswordHash { get; set; } = null!;

    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
}
