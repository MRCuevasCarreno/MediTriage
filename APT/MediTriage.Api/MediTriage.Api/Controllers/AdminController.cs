// Controllers/AdminController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Data;

namespace MediTriage.Api.Controllers
{
    [ApiController]
    [Route("admin")] // <--- SIN /api, la ruta final será /admin/stats
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        public class AdminStatsDto
        {
            public int Patients { get; set; }
            public int Doctors { get; set; }
            public int Appointments { get; set; }
            public int NoShows { get; set; }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<AdminStatsDto>> GetStats()
        {
            var patients = await _db.Patients.CountAsync();
            var doctors  = await _db.Doctors.CountAsync();
            var appointments = await _db.Appointments.CountAsync();

            // Ajusta esta línea si tienes un campo real para no-shows
            var noShows = 0;

            return Ok(new AdminStatsDto
            {
                Patients = patients,
                Doctors = doctors,
                Appointments = appointments,
                NoShows = noShows
            });
        }
    }
}
