export type Appointment = {
    id: number;
    patientId: number;
    doctorId: number;
    start: string; // ISO
    end: string;   // ISO
    status: number;
    triageLevel?: string;
    triageNotes?: string;
  };
  