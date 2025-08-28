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
        // Si viene en modo "force", limpiamos tablas dependientes (sin tocar Users)
        if (force)
        {
            // Limpia en orden por FKs
            await db.Appointments.ExecuteDeleteAsync();
            await db.Doctors.ExecuteDeleteAsync();
            await db.Patients.ExecuteDeleteAsync();
            // Nota: Si necesitas también limpiar Users, hazlo manualmente para no borrar admins.
        }
        else
        {
            // Idempotente: si ya hay Doctors o Patients, no re-sembrar.
            if (await db.Doctors.AnyAsync() || await db.Patients.AnyAsync())
                return;
        }

        // Reproducible
        Randomizer.Seed = new Random(12345);

        // ---------- 1) Usuarios para Doctores y Pacientes ----------
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

        var userDoctorFaker = new Faker<User>("es")
            .RuleFor(u => u.Name, f => $"{f.Name.FirstName()} {f.Name.LastName()}")
            .RuleFor(u => u.Email, (f, u) => $"{u.Name.Replace(' ', '.').ToLower()}{f.Random.Int(10, 999)}@meditriage.cl")
            .RuleFor(u => u.Role, _ => UserRole.Doctor);

        var userPatientFaker = new Faker<User>("es")
            .RuleFor(u => u.Name, f => $"{f.Name.FirstName()} {f.Name.LastName()}")
            .RuleFor(u => u.Email, (f, u) => $"{u.Name.Replace(' ', '.').ToLower()}{f.Random.Int(10, 999)}@example.com")
            .RuleFor(u => u.Role, _ => UserRole.Patient);

        var doctorUsers = userDoctorFaker.Generate(doctors);
        var patientUsers = userPatientFaker.Generate(patients);

        await db.Users.AddRangeAsync(doctorUsers);
        await db.Users.AddRangeAsync(patientUsers);
        await db.SaveChangesAsync(); // Necesario para tener los User.Id (int) generados

        // ---------- 2) Doctores / Pacientes (FK a UserId) ----------
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
            DateOfBirth = fakerEs.Date.Past(60, DateTime.Today.AddYears(-18)) // 18..78 años
        }).ToList();

        await db.Doctors.AddRangeAsync(doctorsList);
        await db.Patients.AddRangeAsync(patientsList);
        await db.SaveChangesAsync();

        // ---------- 3) Citas demo (Appointments) ----------
        var triage = new[] { "LOW", "MEDIUM", "HIGH" };
        var rnd = new Random(2025);
        var allAppointments = new List<Appointment>();

        foreach (var patient in patientsList)
        {
            int count = rnd.Next(0, maxAppointmentsPerPatient + 1); // 0..max
            for (int i = 0; i < count; i++)
            {
                var doctor = doctorsList[rnd.Next(doctorsList.Count)];
                var daysOffset = rnd.Next(-15, 30); // citas recientes y próximas
                var start = DateTime.Today.AddDays(daysOffset).AddHours(rnd.Next(8, 17)); // 08:00-16:00
                var end = start.AddMinutes(new[] { 20, 30, 40, 60 }[rnd.Next(4)]);

                var status = AppointmentStatus.Scheduled;
                if (start.Date < DateTime.Today.Date)
                {
                    // pasado → Completed o Cancelled
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

        // --- Log rápido en consola ---
        var users = await db.Users.CountAsync();
        var docs = doctorsList.Count;
        var pats = patientsList.Count;
        var appt = allAppointments.Count;
        Console.WriteLine($"[SEED] Users={users} Doctors={docs} Patients={pats} Appointments={appt}");
    }
}
