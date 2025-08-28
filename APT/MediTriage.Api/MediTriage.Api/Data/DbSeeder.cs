using Bogus;
using MediTriage.Api.Data;
using MediTriage.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MediTriage.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        int doctors = 15,
        int patients = 60,
        int maxAppointmentsPerPatient = 3,
        bool force = false)
    {
        if (force)
        {
            await db.Appointments.ExecuteDeleteAsync();
            await db.Doctors.ExecuteDeleteAsync();
            await db.Patients.ExecuteDeleteAsync();
            // ⚠️ No borramos Users para no perder admins
        }
        else
        {
            if (await db.Doctors.AnyAsync() || await db.Patients.AnyAsync())
                return;
        }

        Randomizer.Seed = new Random(12345);

        var specialties = new[]
        {
            "Medicina General", "Pediatría", "Ginecología", "Cardiología",
            "Dermatología", "Traumatología", "Neurología", "Otorrinolaringología",
            "Oftalmología", "Psiquiatría", "Endocrinología"
        };

        var centerNames = new[]
        {
            "Clínica Central", "Hospital Regional", "CESFAM Batuco",
            "Clínica Demo", "Centro Médico Norte"
        };

        // 🔑 Todos los usuarios de demo con misma pass "Demo123!"
        const string DEMO_PASS = "Demo123!";
        var demoHash = BCrypt.Net.BCrypt.HashPassword(DEMO_PASS);

        var userDoctorFaker = new Faker<User>("es")
            .RuleFor(u => u.Name, f => $"{f.Name.FirstName()} {f.Name.LastName()}")
            .RuleFor(u => u.Email, (f, u) => $"{u.Name.Replace(' ', '.').ToLower()}{f.Random.Int(10, 999)}@meditriage.cl")
            .RuleFor(u => u.Role, _ => UserRole.Doctor)
            .RuleFor(u => u.PasswordHash, _ => demoHash);

        var userPatientFaker = new Faker<User>("es")
            .RuleFor(u => u.Name, f => $"{f.Name.FirstName()} {f.Name.LastName()}")
            .RuleFor(u => u.Email, (f, u) => $"{u.Name.Replace(' ', '.').ToLower()}{f.Random.Int(10, 999)}@example.com")
            .RuleFor(u => u.Role, _ => UserRole.Patient)
            .RuleFor(u => u.PasswordHash, _ => demoHash);

        var doctorUsers = userDoctorFaker.Generate(doctors);
        var patientUsers = userPatientFaker.Generate(patients);

        await db.Users.AddRangeAsync(doctorUsers);
        await db.Users.AddRangeAsync(patientUsers);
        await db.SaveChangesAsync();

        var doctorsList = doctorUsers.Select((u, idx) => new Doctor
        {
            UserId = u.Id,
            Specialty = specialties[idx % specialties.Length],
            Center = centerNames[idx % centerNames.Length]
        }).ToList();

        var fakerEs = new Faker("es");
        var patientsList = patientUsers.Select(u => new Patient
        {
            UserId = u.Id,
            DateOfBirth = fakerEs.Date.Past(60, DateTime.Today.AddYears(-18))
        }).ToList();

        await db.Doctors.AddRangeAsync(doctorsList);
        await db.Patients.AddRangeAsync(patientsList);
        await db.SaveChangesAsync();

        var triage = new[] { "LOW", "MEDIUM", "HIGH" };
        var rnd = new Random(2025);
        var allAppointments = new List<Appointment>();

        foreach (var patient in patientsList)
        {
            int count = rnd.Next(0, maxAppointmentsPerPatient + 1);
            for (int i = 0; i < count; i++)
            {
                var doctor = doctorsList[rnd.Next(doctorsList.Count)];
                var daysOffset = rnd.Next(-15, 30);
                var start = DateTime.Today.AddDays(daysOffset).AddHours(rnd.Next(8, 17));
                var end = start.AddMinutes(new[] { 20, 30, 40, 60 }[rnd.Next(4)]);

                var status = AppointmentStatus.Scheduled;
                if (start.Date < DateTime.Today.Date)
                {
                    status = rnd.NextDouble() < 0.85 ? AppointmentStatus.Completed : AppointmentStatus.Cancelled;
                }

                allAppointments.Add(new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    Start = start,
                    End = end,
                    Status = status,
                    TriageLevel = rnd.NextDouble() < 0.15 ? "HIGH" : triage[rnd.Next(triage.Length)],
                    TriageNotes = "Consulta generada por seeder"
                });
            }
        }

        if (allAppointments.Count > 0)
        {
            await db.Appointments.AddRangeAsync(allAppointments);
            await db.SaveChangesAsync();
        }

        // 🔑 Admin por defecto
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            var admin = new User
            {
                Name = "Admin MediTriage",
                Email = "admin@meditriage.local",
                Role = UserRole.Admin,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!")
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
        }

        var users = await db.Users.CountAsync();
        Console.WriteLine($"[SEED] Users={users} Doctors={doctorsList.Count} Patients={patientsList.Count} Appointments={allAppointments.Count}");
    }
}
