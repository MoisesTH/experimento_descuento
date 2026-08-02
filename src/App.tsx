/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Info, Banknote, CheckCircle2, User, Calendar, Coffee } from 'lucide-react';
import { Screen, BlockData, Choice } from './types';
import { STIMULI_GROUPS } from './constants';
import { enviarResultadosAGoogle, solicitarAsignacion, FilaEnsayo } from './services/googleSheets';

const RATE_SEQUENCE_BY_TRIAL = [
  1.05, 1.11, 1.18, 1.25, 1.43, 1.82,
  1.00, 1.05, 1.18, 1.33, 1.67, 2.22,
  1.05, 1.11, 1.18, 1.25, 1.43, 1.82,
  1.00, 1.05, 1.18, 1.33, 1.67, 2.22
];


const getDelayMetadata = (bloque: BlockData) => {
  const delayMatch = bloque.id.match(/-(d[1-4])$/);
  const delayId = delayMatch?.[1] ?? 'd1';

  const start_day = delayId === 'd3' || delayId === 'd4' ? 35 : 0;
  const delay = delayId === 'd2' || delayId === 'd4' ? 63 : 35;

  return { start_day, delay };
};

const ALL_BLOCKS = Object.values(STIMULI_GROUPS).flat();
const STORAGE_KEY = 'experimento-asignacion';

type ResponseWithTime = Choice & {
  tiempo_respuesta_ms?: number;
};

type StoredAssignmentState = {
  participantId: string;
  sessionNum: string;
  assignmentId: string;
  assignedSequence: string[];
  assignedMagnitudes: number[];
  screen: Screen;
  currentBlockIndex: number;
  responses: Record<string, ResponseWithTime>;
};

const buildBlocksFromSequence = (sequence: string[]): BlockData[] => {
  const mappedBlocks = sequence
    .map(id => ALL_BLOCKS.find(block => block.id === id))
    .filter((block): block is BlockData => Boolean(block));

  if (mappedBlocks.length !== sequence.length) {
    throw new Error('Asignación inválida: la secuencia de bloques recibida es incompleta o desconocida. Por favor, reinicia la sesión con el coordinador.');
  }

  return mappedBlocks;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [participantId, setParticipantId] = useState('');
  const [sessionNum, setSessionNum] = useState('001');
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseWithTime>>({});
  const [shuffledBlocks, setShuffledBlocks] = useState<BlockData[]>(ALL_BLOCKS);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignedSequence, setAssignedSequence] = useState<string[]>([]);
  const [assignedMagnitudes, setAssignedMagnitudes] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tiempoInicioBloque, setTiempoInicioBloque] = useState<number>(Date.now());

  // Comprehension screen state
  const [comprehensionStep, setComprehensionStep] = useState(1);
  const [compAnswer, setCompAnswer] = useState<string | null>(null);
  const [compShowResult, setCompShowResult] = useState(false);
  const [compIsCorrect, setCompIsCorrect] = useState<boolean | null>(null);

  // Handle countdown resetting when entering the feedback screen
  useEffect(() => {
    if (screen === 'feedback') {
      setCountdown(30);
    }
  }, [screen]);

  // Handle active countdown logic
  useEffect(() => {
    if (screen !== 'feedback' || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, countdown]);

  useEffect(() => {
    if (screen === 'task') {
      setTiempoInicioBloque(Date.now());
    }
  }, [screen, currentBlockIndex]);


  // Restore assignment state from localStorage to avoid re-consulting doGet
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as StoredAssignmentState;
      if (!parsed?.assignmentId || !Array.isArray(parsed.assignedSequence) || parsed.assignedSequence.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const orderedBlocks = buildBlocksFromSequence(parsed.assignedSequence);
      setParticipantId(parsed.participantId ?? '');
      setSessionNum(parsed.sessionNum ?? '001');
      setAssignmentId(parsed.assignmentId);
      setAssignedSequence(parsed.assignedSequence);
      setAssignedMagnitudes(parsed.assignedMagnitudes ?? []);
      setShuffledBlocks(orderedBlocks);
      setScreen(parsed.screen ?? 'instructions');
      setCurrentBlockIndex(parsed.currentBlockIndex ?? 0);
      setResponses(parsed.responses ?? {});
    } catch (error) {
      console.warn('No se pudo restaurar la asignación guardada:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!assignmentId) return;

    const data: StoredAssignmentState = {
      participantId,
      sessionNum,
      assignmentId,
      assignedSequence,
      assignedMagnitudes,
      screen,
      currentBlockIndex,
      responses,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [assignmentId, participantId, sessionNum, assignedSequence, assignedMagnitudes, screen, currentBlockIndex, responses]);

  // Scroll to top when changing screens or active blocks
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [screen, currentBlockIndex]);

  const currentBlock = shuffledBlocks[currentBlockIndex];

  const [exampleResponses, setExampleResponses] = useState<Record<string, Choice>>({});

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId.trim()) return;

    setAssignmentLoading(true);
    setAssignmentError(null);

    try {
      const assignment = await solicitarAsignacion();
      if (assignment.result !== 'success') {
        throw new Error(assignment.message || assignment.error || 'Error al solicitar asignación');
      }

      setAssignmentId(assignment.idInterno ?? null);
      setAssignedSequence(assignment.secuencia ?? []);
      setAssignedMagnitudes(assignment.ordenMagnitudes ?? []);

      if (assignment.secuencia && assignment.secuencia.length > 0) {
        const orderedBlocks = buildBlocksFromSequence(assignment.secuencia);
        setShuffledBlocks(orderedBlocks);
      }

      setScreen('instructions');
    } catch (error) {
      console.error('Error al obtener asignación:', error);
      setAssignmentError(error instanceof Error ? error.message : String(error));
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleSelect = (rowId: string, choice: Choice) => {
    const tiempoActual = Date.now();
    const tiempoTranscurrido = tiempoActual - tiempoInicioBloque;

    setResponses(prev => ({
      ...prev,
      [rowId]: {
        ...choice,
        tiempo_respuesta_ms: tiempoTranscurrido,
      },
    }));
  };

  const handleExampleSelect = (rowId: string, choice: Choice) => {
    setExampleResponses(prev => ({ ...prev, [rowId]: choice }));
  };

  const isBlockComplete = useMemo(() => {
    if (!currentBlock) return false;
    return currentBlock.rows.every(row => responses[row.id]);
  }, [currentBlock, responses]);

  const isExampleComplete = useMemo(() => {
    return Object.keys(exampleResponses).length >= 2;
  }, [exampleResponses]);

  const nextBlock = async () => {
    if (!isBlockComplete) return;

    setIsTransitioning(true);

    // Brief pause to show the checkmark/success state
    setTimeout(async () => {
      setIsTransitioning(false);
      const isEndOfAmountGroup = (currentBlockIndex + 1) % 4 === 0;

      if (currentBlockIndex < shuffledBlocks.length - 1) {
        setCurrentBlockIndex(prev => prev + 1);
        if (isEndOfAmountGroup) {
          setScreen('feedback');
        }
      } else {
        // ==========================================
        // ¡LLEGAMOS AL FINAL DEL EXPERIMENTO (BLOQUE 12) !
        // ==========================================
        setIsSaving(true);
        setScreen('finished');

        try {
          let orderCounter = 1;
          const ensayosFinales: FilaEnsayo[] = [];
          const trialCountersByBudget = new Map<number, number>();
          let rateRowIndex = 0;
          let previousMagnitude: number | null = null;
          let previousBudget: number | null = null;
          let currentBudgetContrast = 0;

          // Recorremos los bloques barajados (shuffledBlocks) para armar las 72 filas exactas
          shuffledBlocks.forEach((bloque) => {
            const budgetMatch = bloque.id.match(/block-(\d+)-/);
            const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : 2000;

            let magnitude = 1;
            if (budget === 200) magnitude = 0;
            if (budget === 20000) magnitude = 2;

            const { start_day, delay } = getDelayMetadata(bloque);
            const isNewBudgetGroup = budget !== previousBudget;
            if (isNewBudgetGroup) {
              currentBudgetContrast = previousMagnitude === null ? 0 : magnitude - previousMagnitude;
            }
            const contrast = currentBudgetContrast;

            bloque.rows.forEach((row) => {
              const userChoice = responses[row.id];

              const currentTrial = (trialCountersByBudget.get(budget) ?? 0) + 1;
              trialCountersByBudget.set(budget, currentTrial);

              let choiceIndex = 0;
              let amount_now = 0;
              let amount_later = 0;
              let tiempo_respuesta_ms = 0;

              if (userChoice) {
                const foundIndex = row.choices.findIndex(
                  c => c.today === userChoice.today && c.later === userChoice.later
                );
                if (foundIndex !== -1) choiceIndex = foundIndex + 1;
                amount_now = userChoice.today;
                amount_later = userChoice.later;
                tiempo_respuesta_ms = userChoice.tiempo_respuesta_ms ?? 0;
              }

              const rate = RATE_SEQUENCE_BY_TRIAL[rateRowIndex % RATE_SEQUENCE_BY_TRIAL.length];
              rateRowIndex += 1;

              ensayosFinales.push({
                order: orderCounter++,
                trial: currentTrial,
                budget,
                magnitude,
                start_day,
                delay,
                rate,
                contrast,
                choice: choiceIndex,
                amount_now,
                amount_later,
                tiempo_respuesta_ms
              });
            });

            if (isNewBudgetGroup) {
              previousMagnitude = magnitude;
              previousBudget = budget;
            }
          });

          // Enviamos el paquete masivo a Google Sheets
          await enviarResultadosAGoogle(participantId, ensayosFinales, assignmentId ?? undefined);
          localStorage.removeItem(STORAGE_KEY);
          setIsSaving(false);
        } catch (error) {
          console.error('Error al guardar en Google Sheets:', error);
          setIsSaving(false);
          setSaveError(error instanceof Error ? error.message : String(error));
        }
      }
    }, 800);
  };

  const renderSetup = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-10 md:mt-20 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-slate-100 mx-4 md:mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-lg">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Nueva Sesión</h1>
      </div>
      <form onSubmit={handleStart} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">ID del Participante</label>
          <input 
            type="text" 
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Correo o nombre completo"
            required
          />
          <p className="mt-2 text-xs text-slate-400">Usa tu correo electrónico o tu nombre completo para identificar la sesión.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Número de Sesión</label>
          <input 
            type="text" 
            value={sessionNum}
            readOnly
            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
          />
          <p className="mt-2 text-xs text-slate-400">Este valor no puede modificarse.</p>
        </div>
        {assignmentError && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-rose-700 text-sm">
            {assignmentError}
          </div>
        )}
        <button 
          type="submit"
          disabled={assignmentLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${assignmentLoading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {assignmentLoading ? 'Solicitando asignación...' : 'Comenzar Experimento'} <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );

  const renderInstructions = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto mt-10"
    >
      <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
        
        <div className="p-6 md:p-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8 text-blue-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600 block mb-2">Introducción</span>
            <h2 className="text-3xl md:text-5xl font-serif italic text-slate-900 tracking-tight">Bienvenido al Experimento</h2>
            <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Este estudio analiza cómo tomamos decisiones financieras a lo largo del tiempo. Tu participación es fundamental para nuestra investigación.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <Banknote className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">La Tarea</h3>
              <p className="text-slate-600 leading-relaxed">
                En cada escenario deberás elegir la distribución de un monto total de dinero entre dos fechas diferentes. Cada escenario es independiente de los demás.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Sin Respuestas Correctas</h3>
              <p className="text-slate-600 leading-relaxed">
                No hay respuestas correctas o incorrectas; simplemente elige la distribución que te resulte más atractiva personalmente.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 text-amber-900 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Info className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h4 className="text-lg font-bold mb-2">Importante</h4>
                <p className="text-amber-800 leading-relaxed font-medium">
                  Las fechas y cantidades cambian entre escenarios. Lee cuidadosamente cada opción antes de responder.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-50 flex justify-center">
            <button 
              onClick={() => setScreen('example')}
              className="group relative px-10 py-5 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10">Ver Ejemplo Práctico</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderExample = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto mt-6 md:mt-10 p-6 md:p-10 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 px-4"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Ejemplo de la Tarea</h2>
      
      <div className="space-y-8 text-slate-600 mb-10">
        <p className="text-sm md:text-base">
          En cada bloque se te presentarán varios <strong>Escenarios de Decisión</strong>. Tu tarea es elegir la distribución de dinero que más te convenga entre las opciones disponibles. <strong>Cada tarjeta representa una forma distinta de distribuir el mismo monto entre dos fechas.</strong>
        </p>
        
        <div className="bg-blue-50 p-4 md:p-6 rounded-2xl border-l-4 border-blue-500 text-xs md:text-sm">
          <h4 className="font-bold text-blue-900 mb-2">¿Cómo responder?</h4>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Opción A (Izquierda):</strong> Suele darte más dinero <strong>Hoy</strong> pero nada en el futuro.</li>
            <li><strong>Opción F (Derecha):</strong> Suele darte 0 hoy pero el máximo posible <strong>En el Futuro</strong>.</li>
            <li><strong>Opciones Intermedias:</strong> Son combinaciones donde recibes una parte hoy y otra parte después.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-12 bg-slate-50 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 mb-10">
        {/* Example Row 1 */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Escenario de Prueba A (Bono total a distribuir: $600)</span>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-x-visible md:pb-0 scrollbar-hide">
            {[
              { today: 600, later: 0, delay: '4 Meses' },
              { today: 480, later: 120, delay: '4 Meses' },
              { today: 360, later: 240, delay: '4 Meses' },
              { today: 240, later: 360, delay: '4 Meses' },
              { today: 120, later: 480, delay: '4 Meses' },
              { today: 0, later: 600, delay: '4 Meses' }
            ].map((c, i) => {
              const isSelected = exampleResponses['ex1']?.today === c.today && exampleResponses['ex1']?.later === c.later;
              return (
                <motion.div 
                  key={i} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExampleSelect('ex1', c)}
                  className={`p-3 rounded-xl text-center cursor-pointer transition-all border-2 flex-shrink-0 w-[140px] md:w-auto snap-center ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-white/60' : 'opacity-30'}`}>Opción {String.fromCharCode(65 + i)}</div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold flex items-center justify-center gap-1">
                      <Banknote className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} /> ${c.today.toLocaleString()}
                    </div>
                    <div className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>Hoy</div>
                    <div className={`h-px w-3 mx-auto ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                    <div className={`text-sm font-bold flex items-center justify-center gap-1 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                      <Calendar className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-500'}`} /> ${c.later.toLocaleString()}
                    </div>
                    <div className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>En {c.delay}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="md:hidden text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
            <ChevronRight className="w-3 h-3 animate-pulse" /> Desliza para ver todas las opciones
          </div>
        </div>

        {/* Example Row 2 */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Escenario de Prueba B (Bono total a distribuir: $12,000)</span>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-x-visible md:pb-0 scrollbar-hide">
            {[
              { today: 12000, later: 0, delay: '8 Meses' },
              { today: 9600, later: 2400, delay: '8 Meses' },
              { today: 7200, later: 4800, delay: '8 Meses' },
              { today: 4800, later: 7200, delay: '8 Meses' },
              { today: 2400, later: 9600, delay: '8 Meses' },
              { today: 0, later: 12000, delay: '8 Meses' }
            ].map((c, i) => {
              const isSelected = exampleResponses['ex2']?.today === c.today && exampleResponses['ex2']?.later === c.later;
              return (
                <motion.div 
                  key={i} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExampleSelect('ex2', c)}
                  className={`p-3 rounded-xl text-center cursor-pointer transition-all border-2 flex-shrink-0 w-[140px] md:w-auto snap-center ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-white/60' : 'opacity-30'}`}>Opción {String.fromCharCode(65 + i)}</div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold flex items-center justify-center gap-1">
                      <Banknote className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} /> ${c.today.toLocaleString()}
                    </div>
                    <div className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>Hoy</div>
                    <div className={`h-px w-3 mx-auto ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                    <div className={`text-sm font-bold flex items-center justify-center gap-1 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                      <Calendar className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-500'}`} /> ${c.later.toLocaleString()}
                    </div>
                    <div className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>En {c.delay}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="md:hidden text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
            <ChevronRight className="w-3 h-3 animate-pulse" /> Desliza para ver todas las opciones
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400 italic">
          {isExampleComplete ? '¡Muy bien! Ya puedes continuar.' : 'Por favor, selecciona una opción en cada escenario para practicar.'}
        </p>
        <button 
          onClick={() => setScreen('comprehension')}
          disabled={!isExampleComplete}
          className={`px-10 py-4 rounded-full font-bold transition-all shadow-lg ${
            isExampleComplete ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Entendido, Continuar
        </button>
      </div>
    </motion.div>
  );

  const renderComprehension = () => {
    const questions = [
      {
        id: 1,
        text: "¿Cuándo se entrega la primera recompensa?",
        options: [
          { key: 'A', text: 'Hoy' },
          { key: 'B', text: 'Dentro de 35 días' },
          { key: 'C', text: 'Dentro de 63 días' }
        ],
        correctKey: 'A',
        feedbackError: "Recuerda: En este ejemplo la primera recompensa se entrega hoy."
      },
      {
        id: 2,
        text: "¿Cuándo se entrega la segunda recompensa?",
        options: [
          { key: 'A', text: 'Hoy' },
          { key: 'B', text: 'Dentro de 35 días' },
          { key: 'C', text: 'Dentro de 63 días' }
        ],
        correctKey: 'C',
        feedbackError: "Recuerda: En este ejemplo la segunda recompensa se entrega dentro de 63 días."
      },
      {
        id: 3,
        text: "¿Cuál recompensa llega primero?",
        options: [
          { key: 'A', text: 'El pago de arriba' },
          { key: 'B', text: 'El pago de abajo' }
        ],
        correctKey: 'A',
        feedbackError: "Recuerda: El pago de arriba se entrega hoy y el pago de abajo dentro de 63 días. Por lo tanto, el pago de arriba llega primero."
      },
      {
        id: 4,
        text: "¿Has entendido la opción o desearías regresar a las 3 preguntas nuevamente?",
        options: [
          { key: 'A', text: 'Sí, he entendido la opción y quiero continuar' },
          { key: 'B', text: 'Desearía regresar al inicio de las preguntas' }
        ],
        correctKey: 'A',
        feedbackError: ""
      }
    ];

    const currentQ = questions[comprehensionStep - 1];
    const isConfirmationStep = comprehensionStep === 4;

    const handleSubmit = () => {
      if (!compAnswer) return;
      const correct = compAnswer === currentQ.correctKey;
      setCompIsCorrect(correct);
      setCompShowResult(true);
    };

    const handleNext = () => {
      if (comprehensionStep < 4) {
        setComprehensionStep(prev => prev + 1);
        setCompAnswer(null);
        setCompShowResult(false);
        setCompIsCorrect(null);
      } else {
        setScreen('ready');
      }
    };

    const handleRetry = () => {
      setCompAnswer(null);
      setCompShowResult(false);
      setCompIsCorrect(null);
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl mx-auto mt-6 md:mt-10 px-4"
      >
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
          
          <div className="p-6 md:p-12">
            {/* Header and Progress */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-serif italic text-slate-900">Comprensión de la Tarea</h2>
                  <p className="text-xs text-slate-400 font-medium">Verificación obligatoria antes de comenzar</p>
                </div>
              </div>
              <span className="self-start md:self-center px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {isConfirmationStep ? "Confirmación Final" : `Pregunta ${comprehensionStep} de 3`}
              </span>
            </div>

            {/* Explanation / Context */}
            <div className="space-y-4 text-slate-600 text-sm md:text-base mb-8">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30 text-slate-700">
                <p className="font-medium">
                  💡 <span className="font-bold">Importante:</span> En las siguientes preguntas de la tarea, el primer pago <span className="underline decoration-blue-500 decoration-2 font-bold">NO siempre será hoy</span>. Algunas veces el primer pago será en el futuro (por ejemplo, en 5 semanas).
                </p>
              </div>
              <p className="text-slate-500 text-xs md:text-sm">
                Observa el siguiente ejemplo de decisión para responder las preguntas de verificación:
              </p>
            </div>

            {/* Stimulus Example Card Frame */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 mb-8 max-w-sm mx-auto flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4 text-center">Escenario de Ejemplo (Bono total a distribuir: $4,600)</span>
              
              <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 w-full text-center shadow-sm relative overflow-hidden">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-4">Opción de Pago Distribuido</span>
                <div className="space-y-4">
                  {/* Top part: Pago de arriba */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pago de arriba</div>
                    <div className="text-2xl font-bold text-slate-900 flex items-center gap-1.5 justify-center">
                      <Banknote className="w-5 h-5 text-emerald-500" />
                      $2,000
                    </div>
                    <span className="text-xs text-blue-600 font-semibold mt-1">Hoy</span>
                  </div>
                  
                  <div className="h-px w-16 bg-slate-200 mx-auto"></div>
                  
                  {/* Bottom part: Pago de abajo */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pago de abajo</div>
                    <div className="text-2xl font-bold text-slate-900 flex items-center gap-1.5 justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      $2,600
                    </div>
                    <span className="text-xs text-blue-600 font-semibold mt-1">Dentro de 63 días</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 leading-snug">{currentQ.text}</h3>
            </div>

            {/* Options Selector */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((opt) => {
                const isSelected = compAnswer === opt.key;
                const isDisabled = compShowResult && !isConfirmationStep;
                return (
                  <button
                    key={opt.key}
                    disabled={isDisabled}
                    onClick={() => setCompAnswer(opt.key)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-600 text-blue-900 font-bold shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                    } ${isDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                  >
                    <span className="text-sm md:text-base">{opt.text}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback Screen Message */}
            <AnimatePresence mode="wait">
              {compShowResult && !isConfirmationStep && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  {compIsCorrect ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-900 text-left">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-sm text-emerald-800">¡Correcto!</span>
                        <p className="text-xs md:text-sm mt-1 leading-relaxed">
                          {comprehensionStep === 3 
                            ? "¡Excelente! El pago de arriba (hoy) llega antes que el de abajo (dentro de 63 días)."
                            : "Continúa a la siguiente pregunta."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-900 text-left">
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">X</div>
                      <div>
                        <span className="font-bold block text-sm text-rose-800">Respuesta Incorrecta</span>
                        <p className="text-xs md:text-sm mt-1 leading-relaxed">
                          {currentQ.feedbackError}
                        </p>
                        <span className="font-bold block text-xs text-rose-800 mt-2">Intentemos nuevamente.</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div>
              {isConfirmationStep ? (
                <button
                  onClick={() => {
                    if (compAnswer === 'A') {
                      setScreen('ready');
                    } else if (compAnswer === 'B') {
                      setComprehensionStep(1);
                      setCompAnswer(null);
                      setCompShowResult(false);
                      setCompIsCorrect(null);
                    }
                  }}
                  disabled={!compAnswer}
                  className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                    compAnswer
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  {compAnswer === 'B' ? "Regresar a la Pregunta 1" : "Comenzar el Experimento"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : !compShowResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={!compAnswer}
                  className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                    compAnswer
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  Verificar Respuesta
                </button>
              ) : compIsCorrect ? (
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {comprehensionStep === 3 ? "Siguiente Paso" : "Siguiente Pregunta"} <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 shadow-rose-100"
                >
                  Intentar Nuevamente
                </button>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    );
  };

  const renderReady = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto mt-6 md:mt-10 px-4"
    >
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-60"></div>

        <div className="relative z-10 p-8 md:p-20 text-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-2xl shadow-slate-200 rotate-3"
          >
            <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-7xl font-serif italic text-slate-900 mb-8 md:mb-12 tracking-tight"
          >
            ¿Estás listo?
          </motion.h2>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-8 md:space-y-10 mb-12 md:mb-16 max-w-2xl mx-auto"
          >
            <div className="space-y-4 md:space-y-6">
              <p className="text-xl md:text-3xl text-slate-900 font-medium leading-tight">
                Imagina que en tu trabajo se ha decidido implementar bonos. En cada escenario recibirás un mismo monto de este bono distribuido entre dos fechas diferentes. Tu tarea consiste en elegir la distribución que prefieras.
              </p>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto"></div>
              <p className="text-lg md:text-xl text-slate-500 italic leading-relaxed">
                Los siguientes escenarios representan distintas formas en las que podrías recibir este bono. Tu tarea es indicar cuál distribución prefieres en cada caso.
              </p>
            </div>

            <div className="bg-amber-50/50 p-4 md:p-6 rounded-2xl border border-amber-100/50 flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs md:text-sm text-amber-900/80 leading-relaxed">
                <span className="font-bold block mb-1 text-amber-900">Nota importante:</span>
                Una vez que avances, no podrás regresar a las opciones anteriores. Solo podrás continuar hasta haber contestado todos los escenarios.
              </p>
            </div>

            <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200/60 flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xs md:text-sm text-slate-600 leading-relaxed">
                <span className="font-bold block mb-1 text-slate-900">Recomendación:</span>
                Cada escenario es independiente. Puedes tomar una decisión distinta en cada uno. Lee cuidadosamente las cantidades y las fechas antes de responder.
              </div>
            </div>
          </motion.div>

          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setScreen('task')}
            className="group relative px-10 md:px-16 py-6 md:py-8 bg-blue-600 text-white rounded-full text-xl md:text-2xl font-bold hover:bg-blue-700 transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-4">
              Comenzar Tarea <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderTask = () => {
    if (!currentBlock) return null;

    return (
      <div className="max-w-6xl mx-auto mt-8 px-4">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600 mb-3 block">
            Bloque {currentBlockIndex + 1} de {shuffledBlocks.length}
          </span>
          <h2 className="text-2xl md:text-4xl font-serif italic text-slate-900 mb-4">{currentBlock.title}</h2>
          
          <div className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-6 px-6 md:px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm mt-4">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pago 1</div>
              <div className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" /> {currentBlock.delayText.split(' vs ')[0]}
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pago 2</div>
              <div className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> {currentBlock.delayText.split(' vs ')[1]}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-16">
          {currentBlock.rows.map((row, rowIndex) => (
            <div key={row.id} className="relative">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                    {rowIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Escenario de Decisión</h3>
                    <p className="text-xs text-slate-400 font-medium">Selecciona la distribución de pagos que prefieras</p>
                  </div>
                </div>
              </div>
              
              <div className="flex overflow-x-auto pb-6 gap-4 snap-x md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:overflow-x-visible md:pb-0 scrollbar-hide">
                {row.choices.map((choice, choiceIndex) => {
                  const isSelected = responses[row.id]?.today === choice.today && responses[row.id]?.later === choice.later;
                  return (
                    <motion.div
                      key={choiceIndex}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(row.id, choice)}
                      className={`
                        relative p-6 rounded-2xl cursor-pointer transition-all border-2 text-center flex-shrink-0 w-[240px] md:w-auto snap-center
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white border-slate-100 hover:border-blue-200 text-slate-800 shadow-sm'}
                      `}
                    >
                      <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Opción {String.fromCharCode(65 + choiceIndex)}</div>
                      <div className="space-y-3">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold flex items-center gap-1.5">
                            <Banknote className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                            ${choice.today.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">{currentBlock.delayText.split(' vs ')[0]}</span>
                        </div>
                        
                        <div className="h-px w-8 bg-current opacity-20 mx-auto"></div>
                        
                        <div className="flex flex-col items-center">
                          <div className={`text-xl font-bold flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                            <Calendar className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                            ${choice.later.toLocaleString()}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-tighter ${isSelected ? 'text-white/80' : 'text-slate-600'}`}>
                            {currentBlock.delayText.split(' vs ')[1]}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div 
                          layoutId={`check-${row.id}`}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
                        >
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="md:hidden text-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                <ChevronRight className="w-4 h-4 animate-pulse" /> Desliza para ver todas las opciones
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center pb-20">
          <button
            disabled={!isBlockComplete || isTransitioning}
            onClick={nextBlock}
            className={`
              px-12 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2 min-w-[240px] justify-center
              ${isTransitioning 
                ? 'bg-green-500 text-white shadow-green-100' 
                : isBlockComplete 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            {isTransitioning ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> ¡Listo!
              </motion.div>
            ) : (
              <>Siguiente <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    const radius = 50;
    const strokeWidth = 6;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (countdown / 30) * circumference;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-xl mx-auto mt-20 p-8 md:p-12 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600"></div>

        {/* Header Icon */}
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Coffee className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="text-3xl font-serif italic text-slate-900 mb-4">Pausa de Descanso</h2>
        
        <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          Has completado una sección del experimento. Por favor, toma un breve descanso de 30 segundos para descansar la vista antes de continuar con el siguiente bloque.
        </p>

        {/* Circular Countdown Progress */}
        <div className="relative flex items-center justify-center w-40 h-40 mx-auto mb-10">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track */}
            <circle
              className="text-slate-100"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={normalizedRadius}
              cx="50%"
              cy="50%"
            />
            {/* Countdown line */}
            <motion.circle
              className="text-blue-600"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, strokeLinecap: 'round' }}
              r={normalizedRadius}
              cx="50%"
              cy="50%"
              fill="transparent"
              transition={{ ease: "linear" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-bold font-mono text-slate-900">{countdown}</span>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">segundos</span>
          </div>
        </div>

        {/* Continue Button */}
        <button 
          onClick={() => setScreen('task')}
          disabled={countdown > 0}
          className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
            countdown > 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 shadow-slate-200'
          }`}
        >
          {countdown > 0 ? (
            <>Espera un momento ({countdown}s)...</>
          ) : (
            <>Continuar al Siguiente Bloque <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </motion.div>
    );
  };

  const renderFinished = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto mt-32 p-12 bg-white rounded-3xl shadow-sm border border-slate-100 text-center"
    >
      <h2 className="text-4xl font-serif italic text-slate-900 mb-6">Experimento Finalizado</h2>

      {isSaving ? (
        <div className="py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-700">Guardando tus resultados en la base de datos...</p>
        </div>
      ) : saveError ? (
        <div className="py-4 bg-rose-50 text-rose-800 rounded-2xl mb-8">
          <p className="font-bold">Hubo un problema al sincronizar con la nube.</p>
          <p className="text-sm mt-1">Tus datos están seguros localmente, pero avisa al administrador.</p>
        </div>
      ) : (
        <div className="py-4 bg-emerald-50 text-emerald-800 rounded-2xl mb-8">
          <p className="font-bold">¡Resultados guardados exitosamente en Google Sheets!</p>
        </div>
      )}

      <p className="text-lg text-slate-600 mb-10">
        Gracias por haber participado. Si tienes alguna duda o comentario, comunícate a moisesth55555@gmail.com.
      </p>

      <div className="bg-slate-50 p-6 rounded-2xl text-left mb-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Resumen de Datos</h3>
        <div className="space-y-2 font-mono text-sm">
          <p><span className="text-slate-400">Participante:</span> {participantId}</p>
          <p><span className="text-slate-400">Sesión:</span> {sessionNum}</p>
          <p><span className="text-slate-400">Respuestas:</span> {Object.keys(responses).length} decisiones tomadas</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      <nav className="p-6 flex justify-between items-center border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-slate-800">TD-Experiment</span>
        </div>
        {participantId && (
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>ID: {participantId}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Sesión: {sessionNum}</span>
          </div>
        )}
      </nav>

      <main className="py-10">
        <AnimatePresence mode="wait">
          {screen === 'setup' && renderSetup()}
          {screen === 'instructions' && renderInstructions()}
          {screen === 'example' && renderExample()}
          {screen === 'comprehension' && renderComprehension()}
          {screen === 'ready' && renderReady()}
          {screen === 'task' && renderTask()}
          {screen === 'feedback' && renderFeedback()}
          {screen === 'finished' && renderFinished()}
        </AnimatePresence>
      </main>
    </div>
  );
}
