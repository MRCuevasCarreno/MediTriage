# MediTriage – Plataforma de Citas Médicas con IA

MediTriage es una aplicación web para el agendamiento de citas médicas que incorpora un módulo de triage orientativo basado en inteligencia artificial y un motor de reglas de seguridad para identificar casos urgentes.  

El objetivo del proyecto es optimizar la asignación de citas, mejorar la experiencia de los pacientes al momento de solicitar atención y apoyar a los profesionales de la salud en la gestión de su agenda.

## Funcionalidades principales
- Registro y autenticación de pacientes y médicos.
- Administración de agenda y citas en línea.
- Cuestionario dinámico de síntomas.
- Triage orientativo mediante IA con sugerencia de especialidad y nivel de urgencia.
- Motor de reglas con detección de “banderas rojas” que recomienda acudir directamente a urgencias.
- Panel de médicos para revisar citas y el resultado del triage previo.
- Reportes básicos para administración (no-shows, síntomas más frecuentes).

## Valor agregado
A diferencia de los sistemas de agendamiento tradicionales en el país, MediTriage integra un proceso de orientación inteligente antes de reservar la cita. Esto permite disminuir derivaciones posteriores, reducir tiempos de espera y entregar información más clara al paciente.

**Nota importante:** La orientación entregada por el sistema no constituye un diagnóstico médico. El módulo de IA es únicamente informativo y debe ser complementado siempre con la evaluación de un profesional de la salud.

- ## Stack técnico

- Backend: .NET 8 Web API (C#), Entity Framework Core, SQL Server
- Frontend: React + Vite + TypeScript + Tailwind CSS
- IA: OpenAI API (modelo GPT‑4o o GPT‑5, a definir en configuración)
- Autenticación: JWT con roles (Paciente, Médico, Administrador)
- Observabilidad: logs estructurados y métricas básicas
- Contenedores (opcional): Docker y Docker Compose

---

## Requisitos previos

- .NET SDK 8.0 o superior  
- Node.js LTS (18+ recomendado) y npm  
- SQL Server (local o en contenedor Docker)  
- (Opcional) Docker Desktop para levantar todo con Compose




