import { useEffect, useState } from "react";
import { get } from "../lib/api";

type Me = { email?: string; fullName?: string; role?: string };
type Count = { label: string; value: number };

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [counts, setCounts] = useState<Count[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // función para sacar "total" de varias formas
  function pickTotal(obj: any): number {
    if (!obj) return 0;

    // casos tipo { total: 10 } o { count: 10 }
    if (typeof obj.total === "number") return obj.total;
    if (typeof obj.count === "number") return obj.count;

    // casos tipo { data: { total: 10 } }
    if (obj.data) {
      if (typeof obj.data.total === "number") return obj.data.total;
      if (typeof obj.data.totalCount === "number") return obj.data.totalCount;
      // casos tipo { data: { data: [...] } }
      if (Array.isArray(obj.data.data)) return obj.data.data.length;
      // casos tipo { data: [...] }
      if (Array.isArray(obj.data)) return obj.data.length;
    }

    // casos tipo { items: [...] }
    if (Array.isArray(obj.items)) return obj.items.length;

    return 0;
  }

  useEffect(() => {
    (async () => {
      // 1) quién soy
      try {
        // la mayoría de tus controladores están bajo /api/**
        // tu AuthController estaba en [Route("api/auth")]
        const meRes = await get<Me>("/api/auth/me");
        setMe(meRes);
      } catch {
        // si no existe /api/auth/me no rompemos el dashboard
      }

      // 2) contadores
      try {
        const [docs, pats, apps] = await Promise.all([
          get<any>("/api/Doctors", { PageNumber: 1, PageSize: 1 }),
          get<any>("/api/Patients", { PageNumber: 1, PageSize: 1 }),
          get<any>("/api/Appointments", { PageNumber: 1, PageSize: 1 }),
        ]);

        const c: Count[] = [
          {
            label: "Doctores",
            value: pickTotal(docs),
          },
          {
            label: "Pacientes",
            value: pickTotal(pats),
          },
          {
            label: "Citas",
            value: pickTotal(apps),
          },
        ];
        setCounts(c);
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar indicadores.");
      }
    })();
  }, []);

  return (
    <section>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Panel</h2>
      {me && (
        <p>
          Sesión: <strong>{me.fullName}</strong> ({me.email}) — rol: {me.role}
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        {counts?.map((c, i) => (
          <div
            key={i}
            style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{c.value}</div>
          </div>
        ))}
      </div>
      {!counts && <p style={{ color: "#6b7280" }}>Cargando...</p>}
    </section>
  );
}
