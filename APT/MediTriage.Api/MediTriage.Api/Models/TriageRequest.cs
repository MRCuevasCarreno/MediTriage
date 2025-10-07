public class TriageRequest
{
    public int Age { get; set; }
    public bool Fever { get; set; }
    public int Pain { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class TriageResponse
{
    public string Level { get; set; } = string.Empty;
    public string Specialist { get; set; } = string.Empty;
    public bool RedFlag { get; set; }
}