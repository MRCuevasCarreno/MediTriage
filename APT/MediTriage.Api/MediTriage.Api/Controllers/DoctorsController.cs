using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DoctorsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DoctorListDto>>> Get()
        => await _db.Doctors
            .Include(d => d.User)
            .Select(d => new DoctorListDto { Id = d.Id, Name = d.User.Name, Specialty = d.Specialty })
            .ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DoctorListDto>> GetById(int id)
    {
        var d = await _db.Doctors.Include(x => x.User)
            .Where(x => x.Id == id)
            .Select(x => new DoctorListDto { Id = x.Id, Name = x.User.Name, Specialty = x.Specialty })
            .FirstOrDefaultAsync();

        return d is null ? NotFound() : Ok(d);
    }
}
