namespace MediTriage.Api.Dtos
{
    public class PublicAppointmentCreateDto
    {
        public string FullName { get; set; } = string.Empty;   // nombre paciente
        public string Email { get; set; } = string.Empty;      // email paciente
        public int DoctorId { get; set; }                      // doctor destino

        public DateTime Start { get; set; }
        public DateTime End { get; set; }

        // Opcionales, por si quieres triage inicial
        public string? TriageLevel { get; set; }
        public string? TriageNotes { get; set; }
    }
}
