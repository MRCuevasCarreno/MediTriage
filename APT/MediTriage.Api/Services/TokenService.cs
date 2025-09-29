using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MediTriage.Api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MediTriage.Api.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;
        public TokenService(IConfiguration config) => _config = config;

        public (string token, DateTime expiresUtc) CreateToken(User user)
        {
            var issuer = _config["Jwt:Issuer"] ?? "MediTriage";
            var audience = _config["Jwt:Audience"] ?? "MediTriage";
            var key = _config["Jwt:Key"] ?? "CAMBIA_ESTA_CLAVE_ULTRA_SECRETA_32+_CARACTERES";
            var minutes = int.TryParse(_config["Jwt:ExpiresMinutes"], out var m) ? m : 120;

            var expires = DateTime.UtcNow.AddMinutes(minutes);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Role, user.Role.ToString())
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenString, expires);
        }
    }
}
