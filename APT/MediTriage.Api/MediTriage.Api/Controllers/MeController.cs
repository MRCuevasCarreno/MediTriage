using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    [HttpGet]
    [Authorize]
    public ActionResult Get()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue(ClaimTypes.Name) // fallback si usaste Name en vez de Sid/Sub
                    ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Ok(new
        {
            id = userId,
            email = User.FindFirstValue(ClaimTypes.Email),
            name = User.FindFirstValue(ClaimTypes.Name),
            role = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}
