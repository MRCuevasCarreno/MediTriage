public class SucursalSimpleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty; // <-- Corrección aquí
    public string Location { get; set; } = string.Empty;
}