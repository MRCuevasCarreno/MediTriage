namespace MediTriage.Api.Dtos
{
    
    public record ErrorResponse(string error, string message, object? data = null);
}
