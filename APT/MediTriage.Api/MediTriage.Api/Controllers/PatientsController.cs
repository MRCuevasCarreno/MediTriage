using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MediTriage.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public PatientsController(AppDbContext db) => _db = db;

        // 🔸 1) Paciente se ve a sí mismo
        [HttpGet("me")]
        [Authorize(Roles = "Patient")]
        public async Task<ActionResult> GetMyPatient()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(sub, out var userId))
                return StatusCode(StatusCodes.Status401Unauthorized,
                    new ErrorResponse("Unauthorized", "Usuario no válido."));

            var dto = await _db.Patients
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                .Select(p => new PatientListDto
                {
                    Id = p.Id,
                    Name = p.User.Name,
                    Email = p.User.Email    // 👈 ahora sí lo mandamos
                })
                .FirstOrDefaultAsync();

            return dto is null
                ? StatusCode(StatusCodes.Status404NotFound,
                    new ErrorResponse("NotFound", "Paciente no encontrado."))
                : Ok(new SuccessResponse<PatientListDto>(dto, "Paciente actual."));
        }

        // 🔸 2) Listado paginado (solo doctor/admin)
        [HttpGet]
        [Authorize(Roles = "Doctor,Admin")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult> Get([FromQuery] PaginationQuery query)
        {
            var q = _db.Patients
                .Include(p => p.User)
                .AsQueryable();

            var sortBy = (query.SortBy ?? "name").ToLowerInvariant();
            var desc = string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);

            q = sortBy switch
            {
                "name" => desc ? q.OrderByDescending(p => p.User.Name) : q.OrderBy(p => p.User.Name),
                "id"   => desc ? q.OrderByDescending(p => p.Id)        : q.OrderBy(p => p.Id),
                _      => desc ? q.OrderByDescending(p => p.User.Name) : q.OrderBy(p => p.User.Name),
            };

            var total = await q.CountAsync();

            var data = await q
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(p => new PatientListDto
                {
                    Id = p.Id,
                    Name = p.User.Name,
                    Email = p.User.Email     // 👈 aquí también
                })
                .ToListAsync();

            return Ok(new SuccessResponse<PagedResponse<PatientListDto>>(
                new PagedResponse<PatientListDto>(data, query.PageNumber, query.PageSize, total),
                "Listado de pacientes (paginado)."
            ));
        }

        // 🔸 3) Obtener 1 paciente por id (solo doctor/admin)
        [HttpGet("{id:int}")]
        [Authorize(Roles = "Doctor,Admin")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetById(int id)
        {
            var p = await _db.Patients
                .Include(x => x.User)
                .Where(x => x.Id == id)
                .Select(x => new PatientListDto
                {
                    Id = x.Id,
                    Name = x.User.Name,
                    Email = x.User.Email    // 👈 y aquí
                })
                .FirstOrDefaultAsync();

            return p is null
                ? Error(StatusCodes.Status404NotFound, "NotFound", "Paciente no encontrado.")
                : Success(p, "Paciente encontrado.");
        }

        // helpers
        private ObjectResult Error(int statusCode, string code, string message, object? data = null)
            => StatusCode(statusCode, new ErrorResponse(code, message, data));

        private OkObjectResult Success<T>(T data, string message)
            => Ok(new SuccessResponse<T>(data, message));
    }
}
