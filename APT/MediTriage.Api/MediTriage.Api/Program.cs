using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MediTriage.Api.Data;
using MediTriage.Api.Dtos;
using MediTriage.Api.Middleware; // UseGlobalExceptionHandling()
using MediTriage.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ==== Controllers & JSON ====
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;

        // ✅ ARREGLO CLAVE (recomendado):
        // Permite que "patient" | "doctor" | "admin" mapeen a tu enum Role en los DTOs
        opt.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)
        );
    });

// ==== Swagger ====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MediTriage API", Version = "v1" });

    // JWT en Swagger
    var jwtScheme = new OpenApiSecurityScheme
    {
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        Description = "Usa: Bearer {tu_token_jwt}",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition(jwtScheme.Reference.Id, jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtScheme, Array.Empty<string>() }
    });
});

// ==== DbContext ====
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ==== CORS ====
// Dev: habilita Vite (http://localhost:5173). Prod: configura tu dominio real.
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevAll", p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());

    options.AddPolicy("ProdUI", p => p
        .WithOrigins(builder.Configuration["Cors:ProdOrigin"] ?? "https://tu-dominio.com")
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

// ==== JWT Auth ====
var jwtKey = builder.Configuration["Jwt:Key"] ?? "CAMBIA_ESTA_CLAVE_ULTRA_SECRETA_32+_CARACTERES";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MediTriage";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MediTriage";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// Token service + HttpClient
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient();

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
// Opción A (HTTPS) es la MÁS RECOMENDABLE para que local se parezca a producción.
app.UseHttpsRedirection();

// CORS: usa DevAll en desarrollo y ProdUI en producción
app.UseCors(app.Environment.IsDevelopment() ? "DevAll" : "ProdUI");

// ==== Excepciones globales ====
app.UseGlobalExceptionHandling();

// ==== AuthZ ====
app.UseAuthentication();
app.UseAuthorization();

// ==== 404 homogéneo ====
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

// ping
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// ==== Migrate + Seed al inicio ====
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // 👇 LOG para confirmar instancia/BD reales
    var conn = db.Database.GetDbConnection();
    Console.WriteLine($"[DB] Provider={db.Database.ProviderName} DataSource={conn.DataSource} Database={conn.Database}");

    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, doctors: 18, patients: 80, maxAppointmentsPerPatient: 3, force: false);
}


// (Opcional) tokens externos
var hfToken = builder.Configuration["HuggingFace:Token"];

app.Run();
