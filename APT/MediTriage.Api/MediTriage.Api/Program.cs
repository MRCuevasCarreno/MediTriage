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

// ==== Seed de datos demo (migrar + poblar) ====
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync(); // aplica migraciones pendientes

    // Usar force:true para ver datos inmediatamente. Cambia a false cuando ya no quieras re-sembrar.
    //TODO cambiar force a true cuando se requiera rellenar base de datos con citas, doctores y pacientes
    await DbSeeder.SeedAsync(db, doctors: 18, patients: 80, maxAppointmentsPerPatient: 3, force: false);
}

app.Run();

// https://localhost:7290/swagger
