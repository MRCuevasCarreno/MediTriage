using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediTriage.Api.Dtos
{
    public class RegisterRequest
    {
        [Required, EmailAddress]
        [JsonPropertyName("email")] public string Email { get; set; } = default!;

        [Required, MinLength(6)]
        [JsonPropertyName("password")] public string Password { get; set; } = default!;

        [Required]
        [JsonPropertyName("fullName")] public string FullName { get; set; } = default!;

        // "patient" | "doctor" | "admin"
        [Required]
        [JsonPropertyName("role")] public string Role { get; set; } = default!;
    }

    public class LoginRequest
    {
        [Required, EmailAddress]
        [JsonPropertyName("email")] public string Email { get; set; } = default!;

        [Required]
        [JsonPropertyName("password")] public string Password { get; set; } = default!;
    }

    public class AuthResponse
    {
        [JsonPropertyName("token")] public string Token { get; set; } = default!;
        [JsonPropertyName("expiresAtUtc")] public DateTime ExpiresAtUtc { get; set; }
        [JsonPropertyName("email")] public string Email { get; set; } = default!;
        [JsonPropertyName("fullName")] public string FullName { get; set; } = default!;
        [JsonPropertyName("role")] public string Role { get; set; } = default!;
    }
}
