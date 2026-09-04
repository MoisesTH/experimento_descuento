/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// URL del despliegue Web de Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyALes_XDBf7wXmTNqg4mK9S7h3Q3LSe7IjxOEuJ8OW2Es_ualauo7lv8PpLQ60pXsR/exec"; // <-- Asegúrate de que sea tu URL activa

export interface FilaEnsayo {
  order: number;
  trial: number;
  budget: number;
  magnitude: number;
  start_day: number;
  delay: number;
  rate: number;
  contrast: number;
  choice: number;
  amount_now: number;
  amount_later: number;
  tiempo_respuesta_ms?: number;
  edad?: string;
  genero?: string;
  sesion?: string;
  dispositivo?: string;
}

export interface GoogleSheetsResponse {
  result: 'success' | 'error';
  error?: string;
  message?: string;
}

export interface AssignmentResponse {
  result: 'success' | 'error';
  idInterno?: string;
  secuencia?: string[];
  ordenMagnitudes?: number[];
  error?: string;
  message?: string;
}

// ==========================================
// 1. SOLICITAR ASIGNACIÓN (POST)
// ==========================================
export async function solicitarAsignacion(idInterno?: string): Promise<AssignmentResponse> {
  try {
    const payload: Record<string, unknown> = { accion: 'solicitarAsignacion' };
    if (idInterno) {
      payload.idInterno = idInterno;
      payload.ID_INTERNO = idInterno;
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error al solicitar asignación: ${response.status} ${response.statusText}`);
    }

    const data: AssignmentResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error en solicitarAsignacion:", error);
    throw error;
  }
}

// ==========================================
// 2. ENVIAR RESULTADOS FINALES (POST)
// ==========================================
export const enviarResultadosAGoogle = async (
  idSujeto: string,
  ensayos: FilaEnsayo[],
  idInterno?: string,
  demograficos?: { edad?: string; genero?: string; sesion?: string; dispositivo?: string }
): Promise<GoogleSheetsResponse> => {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('URL de Google Script no configurada');
    return { result: 'success' };
  }

  // Normalizamos las propiedades para garantizar compatibilidad total
  const ensayosMayus = ensayos.map((ensayo) => ({
    ORDER: ensayo.order,
    TRIAL: ensayo.trial,
    BUDGET: ensayo.budget,
    MAGNITUDE: ensayo.magnitude,
    START_DAY: ensayo.start_day,
    DELAY: ensayo.delay,
    RATE: ensayo.rate,
    CONTRAST: ensayo.contrast,
    CHOICE: ensayo.choice,
    AMOUNT_NOW: ensayo.amount_now,
    AMOUNT_LATER: ensayo.amount_later,
    TIEMPO_RESPUESTA_MS: ensayo.tiempo_respuesta_ms ?? 0,
    EDAD: demograficos?.edad ?? ensayo.edad ?? '',
    GENERO: demograficos?.genero ?? ensayo.genero ?? '',
    DISPOSITIVO: demograficos?.dispositivo ?? ensayo.dispositivo ?? '',
    SESION: demograficos?.sesion ?? ensayo.sesion ?? '',
    // Compatibilidad en minúsculas
    order: ensayo.order,
    trial: ensayo.trial,
    budget: ensayo.budget,
    magnitude: ensayo.magnitude,
    start_day: ensayo.start_day,
    delay: ensayo.delay,
    rate: ensayo.rate,
    contrast: ensayo.contrast,
    choice: ensayo.choice,
    amount_now: ensayo.amount_now,
    amount_later: ensayo.amount_later,
    tiempo_respuesta_ms: ensayo.tiempo_respuesta_ms ?? 0,
    edad: demograficos?.edad ?? ensayo.edad ?? '',
    genero: demograficos?.genero ?? ensayo.genero ?? '',
    dispositivo: demograficos?.dispositivo ?? ensayo.dispositivo ?? '',
    sesion: demograficos?.sesion ?? ensayo.sesion ?? ''
  }));

  const payload: Record<string, unknown> = {
    idInterno: idInterno ?? '',
    ID_INTERNO: idInterno ?? '',
    usuarioManual: idSujeto,
    USUARIO_MANUAL: idSujeto,
    EDAD: demograficos?.edad ?? '',
    GENERO: demograficos?.genero ?? '',
    SESION: demograficos?.sesion ?? '',
    DISPOSITIVO: demograficos?.dispositivo ?? '',
    edad: demograficos?.edad ?? '',
    genero: demograficos?.genero ?? '',
    sesion: demograficos?.sesion ?? '',
    dispositivo: demograficos?.dispositivo ?? '',
    ENSAYOS: ensayosMayus
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor de Google: ${response.status} ${response.statusText}`);
    }

    const data: GoogleSheetsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al enviar datos a Google Sheets:', error);
    throw error;
  }
};
