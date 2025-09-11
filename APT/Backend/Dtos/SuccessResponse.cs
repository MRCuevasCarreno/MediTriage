namespace MediTriage.Api.Dtos
{
    /// <summary>
    /// Estructura estándar para respuestas exitosas.
    /// </summary>
    public class SuccessResponse<T>
    {
        public T Data { get; init; }
        public string Message { get; init; }

        public SuccessResponse(T data, string message)
        {
            Data = data;
            Message = message;
        }
    }
}
