using System.Net.Mime;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using MediTriage.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediTriage.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [Produces(MediaTypeNames.Application.Json)]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ITokenService _tokens;

        public AuthController(AppDbContext db, ITokenService tokens)
        {
            _db = db;
            _tokens = tokens;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
        {
            var email = req.Email.Trim().ToLowerInvariant();
            if (await _db.Users.AnyAsync(u => u.Email == email))
                return Conflict(new { message = "Email ya registrado" });

            if (!Enum.TryParse<UserRole>(req.Role, true, out var role))
                return BadRequest(new { message = "Role inválido. Usa: patient | doctor | admin" });

            var user = new User
            {
                Email = email,
                Name = req.FullName.Trim(), // mapeamos FullName del DTO a Name del modelo
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var (token, exp) = _tokens.CreateToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                ExpiresAtUtc = exp,
                Email = user.Email,
                FullName = user.Name,
                Role = user.Role.ToString()
            });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
        {
            var email = req.Email.Trim().ToLowerInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
                return Unauthorized(new { message = "Credenciales inválidas" });

            var ok = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
            if (!ok)
                return Unauthorized(new { message = "Credenciales inválidas" });

            var (token, exp) = _tokens.CreateToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                ExpiresAtUtc = exp,
                Email = user.Email,
                FullName = user.Name,
                Role = user.Role.ToString()
            });
        }
    }
}
