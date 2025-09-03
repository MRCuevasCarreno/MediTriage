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
  
export type BasicEntity = {
  id: number;
  name: string;
};

export type Patient = BasicEntity & {
  // add fields as needed
};

export type Doctor = BasicEntity & {
  // add fields as needed
};
