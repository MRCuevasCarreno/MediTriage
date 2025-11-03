namespace MediTriage.Api.Dtos
{
    public class PublicAppointmentCreateDto
    {
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public int DoctorId { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public string? Rut { get; set; } // Nuevo campo opcional
        public string? TriageNotes { get; set; } // Nuevo campo opcional
        public string? TriageLevel { get; set; } // Nuevo campo opcional
    }
}
