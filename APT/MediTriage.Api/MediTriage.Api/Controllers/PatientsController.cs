using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PatientsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientListDto>>> Get()
        => await _db.Patients
            .Include(p => p.User)
            .Select(p => new PatientListDto { Id = p.Id, Name = p.User.Name })
            .ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientListDto>> GetById(int id)
    {
        var p = await _db.Patients.Include(x => x.User)
            .Where(x => x.Id == id)
            .Select(x => new PatientListDto { Id = x.Id, Name = x.User.Name })
            .FirstOrDefaultAsync();

        return p is null ? NotFound() : Ok(p);
    }
}
