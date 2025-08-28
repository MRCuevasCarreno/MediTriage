using System.Text.Json;
using System.Text.Json.Serialization;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Models;
using MediTriage.Api.Middleware; // <-- para UseGlobalExceptionHandling()
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ==== Controllers & JSON ====
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// ==== Swagger ====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MediTriage API", Version = "v1" });
});

// ==== DbContext ====
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ==== CORS (frontend Vite) ====
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// ==== ModelState → ErrorResponse homogéneo ====
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(kvp => kvp.Value?.Errors?.Count > 0)
            .ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
            );

        var payload = new ErrorResponse(
            error: "ValidationError",
            message: "Los datos enviados no son válidos.",
            data: new { errors }
        );

        return new BadRequestObjectResult(payload);
    };
});

var app = builder.Build();

// ==== Swagger solo en Desarrollo ====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MediTriage API v1");
    });
}

// ==== HTTP / CORS ====
app.UseHttpsRedirection();
app.UseCors("frontend");

// ==== Manejador global de excepciones (500 → ErrorResponse) ====
app.UseGlobalExceptionHandling();

// ==== (Opcional) 404 homogéneo para rutas inexistentes ====
app.Use(async (ctx, next) =>
{
    await next();

    if (!ctx.Response.HasStarted && ctx.Response.StatusCode == StatusCodes.Status404NotFound)
    {
        ctx.Response.ContentType = "application/json";
        var payload = new ErrorResponse("EndpointNotFound", "Ruta o recurso no encontrado.");
        await ctx.Response.WriteAsJsonAsync(payload);
    }
});

// ==== Endpoints ====
app.MapControllers();

// ping de salud
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// ==== Seed de datos demo ====
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
        // PatientId=1 y DoctorId=1 (probablemente)
    }
}

app.Run();

// https://localhost:7290/swagger
