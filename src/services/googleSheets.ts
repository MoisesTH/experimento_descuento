// src/services/googleSheets.ts

export interface FilaEnsayo {
  order: number;       // 1 al 72
  trial: number;       // Bloque de 24 (o �ndice interno)
  budget: number;      // 200, 2000, 20000
  magnitude: number;   // 0, 1, 2
  start_day: number;   // 0 o 35
  delay: number;       // 35, 63, etc.
  rate: number;        // Tasa de descuento
  contrast: number;    // Contraste
  choice: number;      // 1 al 6 (Opci�n A a F)
  amount_now: number;  // Valor 'today' elegido
  amount_later: number;// Valor 'later' elegido
}

export interface AssignmentResponse {
  result: string;
  idInterno?: string;
  secuencia?: string[];
  ordenMagnitudes?: number[];
  message?: string;
  error?: string;
}

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export async function solicitarAsignacion(): Promise<AssignmentResponse> {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    // Usamos 'text/plain' o sin headers restrictivos para evitar preflight de CORS en POST
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ accion: 'solicitarAsignacion' })
  });

  if (!response.ok) {
    throw new Error(`Error al solicitar asignación: ${response.status}`);
  }

  return response.json();
}

export async function enviarResultadosAGoogle(usuarioId: string, ensayos: FilaEnsayo[], idInterno?: string) {
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
    AMOUNT_LATER: e.amount_later
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

    return true;
  } catch (error) {
    console.error("Error al enviar a Google Sheets:", error);
    throw error;
  }
}
