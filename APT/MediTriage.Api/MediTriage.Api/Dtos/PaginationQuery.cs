namespace MediTriage.Api.Dtos
{
    public class PaginationQuery
    {
        public int PageNumber { get; set; } = 1;   // por defecto página 1
        public int PageSize { get; set; } = 10;    // por defecto 10 registros
        public string? SortBy { get; set; }        // campo por el cual ordenar
        public string? SortDirection { get; set; } // "asc" o "desc"
    }
}
