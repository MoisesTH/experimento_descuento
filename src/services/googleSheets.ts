// src/services/googleSheets.ts

export interface FilaEnsayo {
  order: number;       // 1 al 72
  trial: number;       // Bloque de 24
  budget: number;      // 200, 2000, 20000
  magnitude: number;   // 0, 1, 2
  start_day: number;   // 0 o 35
  delay: number;       // 35, 63, etc.
  rate: number;        // Tasa de descuento
  contrast: number;    // Contraste
  choice: number;      // 1 al 6 (Opción A a F)
  amount_now: number;  // Valor 'today' elegido
  amount_later: number;// Valor 'later' elegido
  tiempo_respuesta_ms?: number; // Tiempo de respuesta en milisegundos
}

export interface AssignmentResponse {
  result: string;
  idInterno?: string;
  secuencia?: string[];
  ordenMagnitudes?: number[];
  message?: string;
  error?: string;
}

// Usamos tu variable de entorno (recuerda configurarla en GitHub o en tu .env local)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPeov30iXtesZPUa4bS0scbEzRwFW98jdEED14hAcYAOu4J7SoiFa9KuDtNh4D_-ji/exec";

// ==========================================
// 1. SOLICITAR ASIGNACIÓN (POST)
// ==========================================
export async function solicitarAsignacion(): Promise<AssignmentResponse> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ accion: 'solicitarAsignacion' })
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
// 2. ENVIAR RESULTADOS (POST)
// ==========================================
export async function enviarResultadosAGoogle(usuarioId: string, ensayos: FilaEnsayo[], idInterno?: string) {
  // Mapeamos al formato en mayúsculas que espera tu backend en Google Apps Script
  const ensayosMayus = ensayos.map(e => ({
    ORDER: e.order,
    TRIAL: e.trial,
    BUDGET: e.budget,
    MAGNITUDE: e.magnitude,
    START_DAY: e.start_day,
    DELAY: e.delay,
    RATE: e.rate,
    CONTRAST: e.contrast,
    CHOICE: e.choice,
    AMOUNT_NOW: e.amount_now,
    AMOUNT_LATER: e.amount_later,
    TIEMPO_RESPUESTA_MS: e.tiempo_respuesta_ms ?? 0
  }));

  const payload: Record<string, unknown> = {
    usuarioManual: usuarioId,
    USUARIO_MANUAL: usuarioId,
    ENSAYOS: ensayosMayus
  };

  if (idInterno) {
    payload.idInterno = idInterno;
    payload.ID_INTERNO = idInterno;
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar resultados: ${response.status} ${response.statusText}`);
    }

    // Opcional: si tu script de envío también devuelve JSON y quieres leerlo
    // const result = await response.json();
    // return result;

    return true;
  } catch (error) {
    console.error("Error al enviar a Google Sheets:", error);
    throw error;
  }
}