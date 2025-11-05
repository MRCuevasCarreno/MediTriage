 
import { useAuth } from "../auth/AuthContext";
import { DoctorCalendar } from "../components/DoctorCalendar";
import { useEffect, useState } from "react";
import { baseURL } from "../lib/api";

export default function Doctor() {
  const { user, token } = useAuth();
  const [doctorId, setDoctorId] = useState<number>(() => Number(user?.doctorId ?? user?.id ?? 0) || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchDoctorMe() {
      // Si el rol es doctor y hay token, obtener /api/Doctors/me para el id real
      if ((user?.role === "doctor" || String(user?.role).toLowerCase() === "doctor") && (token || localStorage.getItem("token"))) {
        setLoading(true);
        try {
          const tk = token || localStorage.getItem("token") || "";
          const res = await fetch(`${baseURL}/api/Doctors/me`, {
            method: "GET",
            headers: {
              Accept: "application/json, text/plain, */*",
              Authorization: `Bearer ${tk}`,
            },
          });
          if (res.ok) {
            const js = await res.json();
            const did = js?.data?.id ?? js?.id ?? null;
            if (!cancelled && did) setDoctorId(Number(did));
          }
        } catch (e) {
          // ignore and fallback to existing doctorId
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }

    fetchDoctorMe();
    return () => { cancelled = true; };
  }, [user?.role, token]);

  if (!doctorId) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <p>No se encontró el ID del médico en la sesión. Por favor revisa tu cuenta o inicia sesión nuevamente.</p>
      </div>
    );
  }

  return (
    <div>
      <DoctorCalendar doctorId={doctorId} />
    </div>
  );
}
