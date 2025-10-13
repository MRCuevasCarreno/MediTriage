using Microsoft.AspNetCore.Mvc;
using MediTriage.Api.Models;
using System.Net.Http.Headers;
using System.Text;

namespace MediTriage.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _hfToken;

    public AiController(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _hfToken = config["HuggingFace:Token"];
    }

    [HttpPost("triage")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Triage([FromBody] TriageRequest request)
    {
        if (request.Age < 0 || request.Pain < 0 || request.Pain > 10)
            return StatusCode(StatusCodes.Status400BadRequest, new { error = "InvalidInput", message = "Edad o dolor fuera de rango." });

        var notesLower = request.Notes.ToLower();
        bool redFlag = notesLower.Contains("dolor de pecho") || notesLower.Contains("adormecimiento de brazo izquierdo");
        string level = (request.Pain >= 8 || redFlag) ? "Alto" :
                       (request.Pain >= 5 || request.Fever) ? "Medio" : "Bajo";
        string specialist = "Medicina General";
        if (request.Age < 18) specialist = "Pediatría";
        else if (notesLower.Contains("piel")) specialist = "Dermatología";
        else if (notesLower.Contains("corazón") || notesLower.Contains("pecho")) specialist = "Cardiología";

        string message = "Respuesta generada por reglas médicas locales.";

        var prompt = $"Paciente de {request.Age} años, fiebre: {(request.Fever ? "sí" : "no")}, dolor: {request.Pain}/10. Nota: {request.Notes}. ¿Nivel de triage (Alto, Medio, Bajo), especialista recomendado y red flag?";
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _hfToken);

        var payload = new { inputs = prompt };
        var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://api-inference.huggingface.co/models/medalpaca/medalpaca-7b", content);
        var result = await response.Content.ReadAsStringAsync();

        bool iaAjusto = false;
        if (!string.IsNullOrWhiteSpace(result))
        {
            if (result.Contains("alto", StringComparison.OrdinalIgnoreCase) && level != "Alto") { level = "Alto"; iaAjusto = true; }
            else if (result.Contains("medio", StringComparison.OrdinalIgnoreCase) && level != "Medio") { level = "Medio"; iaAjusto = true; }
            else if (result.Contains("bajo", StringComparison.OrdinalIgnoreCase) && level != "Bajo") { level = "Bajo"; iaAjusto = true; }

            if (result.Contains("pediatría", StringComparison.OrdinalIgnoreCase) && specialist != "Pediatría") { specialist = "Pediatría"; iaAjusto = true; }
            else if (result.Contains("dermatología", StringComparison.OrdinalIgnoreCase) && specialist != "Dermatología") { specialist = "Dermatología"; iaAjusto = true; }
            else if (result.Contains("cardiología", StringComparison.OrdinalIgnoreCase) && specialist != "Cardiología") { specialist = "Cardiología"; iaAjusto = true; }
            else if (result.Contains("kinesiología", StringComparison.OrdinalIgnoreCase) && specialist != "Kinesiología") { specialist = "Kinesiología"; iaAjusto = true; }
            else if (result.Contains("telemedicina", StringComparison.OrdinalIgnoreCase) && specialist != "Telemedicina") { specialist = "Telemedicina"; iaAjusto = true; }
            else if (result.Contains("medicina general", StringComparison.OrdinalIgnoreCase) && specialist != "Medicina General") { specialist = "Medicina General"; iaAjusto = true; }

            if ((result.Contains("red flag", StringComparison.OrdinalIgnoreCase) || result.Contains("grave", StringComparison.OrdinalIgnoreCase)) && !redFlag)
            {
                redFlag = true;
                iaAjusto = true;
            }
        }

        if (iaAjusto)
            message = "Respuesta ajustada por IA médica (MedAlpaca).";

        var triageResponse = new TriageResponse
        {
            Level = level,
            Specialist = specialist,
            RedFlag = redFlag
        };

        return Ok(new { data = triageResponse, message });
    }
}