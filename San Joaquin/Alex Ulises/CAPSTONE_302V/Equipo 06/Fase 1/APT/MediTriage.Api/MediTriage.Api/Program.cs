using MediTriage.Api.Data;
using MediTriage.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models; // <-- agrega este using

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(x =>
    {
        x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Explorador de endpoints para Swagger
builder.Services.AddEndpointsApiExplorer();

// Generador de Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MediTriage API",
        Version = "v1"
    });
});

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// CORS para el frontend Vite
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MediTriage API v1");
    });
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.MapControllers();

// ping de salud
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

//Para agregar doctor y pacientes demo.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.Users.Any())
    {
        var uPatient = new User { Name = "Paciente Demo", Email = "paciente@demo.com", Role = UserRole.Patient };
        var uDoctor = new User { Name = "Doctor Demo", Email = "doctor@demo.com", Role = UserRole.Doctor };
        db.Users.AddRange(uPatient, uDoctor);
        await db.SaveChangesAsync();

        var p = new Patient { UserId = uPatient.Id, DateOfBirth = new DateTime(1990, 1, 1) };
        var d = new Doctor { UserId = uDoctor.Id, Specialty = "Medicina General", Center = "Clínica Demo" };
        db.Patients.Add(p);
        db.Doctors.Add(d);
        await db.SaveChangesAsync();
        // Ahora tendrás (probablemente) PatientId=1 y DoctorId=1
    }
}

app.Run();
//https://localhost:7290/swagger