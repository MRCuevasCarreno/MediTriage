# MediTriage – Plataforma de Citas Médicas con IA

MediTriage es una aplicación web para el agendamiento de citas médicas que incorpora un módulo de triage orientativo basado en inteligencia artificial y un motor de reglas de seguridad para identificar casos urgentes.

El objetivo del proyecto es optimizar la asignación de citas, mejorar la experiencia de los pacientes al momento de solicitar atención y apoyar a los profesionales de la salud en la gestión de su agenda.

## Funcionalidades principales

* Registro y autenticación de pacientes y médicos.
* Administración de agenda y citas en línea.
* Cuestionario dinámico de síntomas.
* Triage orientativo mediante IA con sugerencia de especialidad y nivel de urgencia.
* Motor de reglas con detección de “banderas rojas” que recomienda acudir directamente a urgencias.
* Panel de médicos para revisar citas y el resultado del triage previo.
* Reportes básicos para administración (no-shows, síntomas más frecuentes).

## Valor agregado

A diferencia de los sistemas de agendamiento tradicionales en el país, MediTriage integra un proceso de orientación inteligente antes de reservar la cita. Esto permite disminuir derivaciones posteriores, reducir tiempos de espera y entregar información más clara al paciente.

**Nota importante:** La orientación entregada por el sistema no constituye un diagnóstico médico. El módulo de IA es únicamente informativo y debe ser complementado siempre con la evaluación de un profesional de la salud.

* ## Stack técnico

* Backend: .NET 8 Web API (C#), Entity Framework Core, SQL Server

* Frontend: React + Vite + TypeScript + Tailwind CSS

* IA: OpenAI API (modelo GPT‑4o o GPT‑5, a definir en configuración)

* Autenticación: JWT con roles (Paciente, Médico, Administrador)

* Observabilidad: logs estructurados y métricas básicas

---

## Requisitos previos

* .NET SDK 8.0 o superior
* Node.js LTS y npm
* SQL Server

---

## Datos demo y autenticación

### 🔑 Usuario Admin por defecto

* **Email:** `admin@meditriage.local`
* **Password:** `Admin123!`
* **Rol:** `Admin`

### 👩‍⚕️ Doctores demo

* Emails generados automáticamente (`juan.perez123@meditriage.cl`, etc.)
* **Password:** `Demo123!` (todos los doctores)
* **Rol:** `Doctor`

### 👨‍🦰 Pacientes demo

* Emails generados automáticamente (`maria.gomez456@example.com`, etc.)
* **Password:** `Demo123!` (todos los pacientes)
* **Rol:** `Patient`

### 🚀 Probar en Swagger

1. Ejecuta la API:

   ```bash
   dotnet run
   ```

   Swagger se abre en: `https://localhost:7290/swagger`

2. `POST /api/auth/login` con el admin:

   ```json
   {
     "email": "admin@meditriage.local",
     "password": "Admin123!"
   }
   ```

3. Copia el `token` y en Swagger presiona **Authorize** → pega como:

   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Ahora puedes probar endpoints protegidos (`/api/appointments`, `/api/doctors`, `/api/patients`).

---

## Endpoint `/api/me`

Se agregó un endpoint para obtener información del usuario autenticado a partir del token JWT:

* **Ruta:** `GET /api/me`
* **Autenticación:** Requiere JWT válido en el header `Authorization: Bearer <token>`

### Ejemplo de respuesta:

```json
{
  "id": 1,
  "email": "admin@meditriage.local",
  "name": "Admin MediTriage",
  "role": "Admin"
}
```

Este endpoint es útil para que el frontend identifique rápidamente al usuario logueado y sus permisos.
