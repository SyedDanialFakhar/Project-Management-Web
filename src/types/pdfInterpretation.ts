export interface InterpretationStore {
    id: string;
    user_id: string;
    file_name: string;
    interpretations: Record<string, string>; // { "patient name": "interpretation text" }
    patient_count: number;
    created_at: string;
  }
  
  export interface ExtractedPatientInfo {
    firstName: string;
    lastName: string;
    fullName: string;
    fullNameFormatted: string;
    confidence: number;
  }
  
  export interface ProcessingResult {
    success: boolean;
    message: string;
    pdfBlob?: Blob;
    fileName?: string;
    patientName?: string;
    interpretation?: string;
  }