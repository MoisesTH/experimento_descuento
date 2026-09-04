import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Monitor, AlertTriangle, ChevronRight, XCircle, Copy, Check } from 'lucide-react';

// Importación directa para que Vite resuelva la ruta en cualquier servidor o GitHub Pages
import logoUnam from '../assets/logo-unam.png';
import logoPsicologia from '../assets/logo-psicologia.png';

interface ConsentScreenProps {
  folio: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentScreen({ folio, onAccept, onDecline }: ConsentScreenProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFolio, setCopiedFolio] = useState(false);

  const canContinue = ageConfirmed && termsConfirmed;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyFolio = () => {
    navigator.clipboard.writeText(folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto px-4 py-4 md:py-8"
    >
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Franja superior institucional */}
        <div className="h-2 bg-gradient-to-r from-[#0B2341] via-[#1E3A8A] to-[#C49A45]" />

        {/* Encabezado con Escudos Oficiales */}
        <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* ESCUDO UNAM (Izquierda) */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <img
                src={logoUnam}
                alt="Escudo UNAM"
                className="h-24 md:h-28 w-auto object-contain max-w-[130px]"
              />
            </div>

            {/* Texto Central Oficial */}
            <div className="text-center flex-1">
              <h1 className="text-sm md:text-base font-serif font-black tracking-wider text-[#0B2341] uppercase">
                Universidad Nacional Autónoma de México
              </h1>
              <h2 className="text-xs md:text-sm font-sans font-bold tracking-wide text-slate-700 mt-1 uppercase">
                Facultad de Psicología
              </h2>
              <h3 className="text-xs md:text-sm font-sans font-semibold text-slate-500 mt-0.5">
                Laboratorio de Comportamiento y Adaptación
              </h3>
            </div>

            {/* LOGO FACULTAD DE PSICOLOGÍA (Derecha) */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <img
                src={logoPsicologia}
                alt="Logotipo Facultad de Psicología UNAM"
                className="h-24 md:h-28 w-auto object-contain max-w-[130px]"
              />
            </div>

          </div>

          {/* Folio Digital Asignado */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider">Folio institucional:</span>
              <code className="font-mono bg-white border border-slate-300 px-2.5 py-1 rounded text-slate-800 font-semibold select-all">
                {folio}
              </code>
              <button
                type="button"
                onClick={handleCopyFolio}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                title="Copiar folio"
              >
                {copiedFolio ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">Asignado automáticamente para esta sesión</span>
          </div>
        </div>

        {/* Cuerpo del Consentimiento Informado */}
        <div className="p-6 md:p-10 space-y-6 text-slate-700 text-sm md:text-[15px] leading-relaxed">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 tracking-tight">
              Consentimiento Informado para Participantes
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Título del estudio: <strong className="text-slate-700">Descuento temporal y efecto de magnitud en presupuestos temporales convexos</strong>
            </p>
          </div>

          <p className="font-medium text-slate-800">
            Estimado(a) participante:
          </p>

          <p>
            Este cuestionario tiene como objetivo estudiar la toma de decisiones sobre consecuencias que ocurren en diferentes puntos en el tiempo. A continuación, encontrarás información importante sobre el estudio antes de decidir si deseas participar.
          </p>

          {/* Sección 1 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">1. ¿En qué consiste este estudio?</h4>
            <p className="text-slate-600">
              Estás siendo invitado(a) a participar en un estudio de investigación sobre cómo las personas toman decisiones económicas que involucran tiempo y dinero. La tarea consiste en una <strong className="text-slate-800">simulación de elecciones económicas hipotéticas</strong>: se te presentarán distintas combinaciones de opciones para distribuir una cantidad de dinero simulado entre un pago disponible antes y un pago disponible después, y deberás elegir la distribución que prefieras en cada caso. No existen respuestas correctas o incorrectas; nos interesa únicamente conocer tus preferencias personales.
            </p>
          </div>

          {/* Sección 2: Requisitos Técnicos */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              2. Requisitos técnicos indispensables
            </h4>
            <p className="text-slate-600">
              Para garantizar la visualización adecuada de los escenarios de decisión y la precisión de la prueba, este estudio <strong className="text-slate-900">debe realizarse desde una computadora de escritorio o laptop</strong> con teclado/ratón y pantalla amplia. No está diseñado para teléfonos móviles.
            </p>

            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm font-medium">
                  ¿Abriste este enlace desde un teléfono móvil? Por favor copia el enlace y ábrelo en un navegador desde tu computadora.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-shrink-0 px-3 py-1.5 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 self-end sm:self-auto"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" /> ¡Enlace copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar enlace
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sección 3 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">3. ¿Qué se te pedirá hacer?</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Leerás instrucciones breves y realizarás un ejemplo interactivo con preguntas de verificación, para familiarizarte con el formato de la tarea antes de comenzar.</li>
              <li>Responderás un total de 72 escenarios de decisión, divididos en 12 bloques breves.</li>
              <li>La plataforma incluye pausas breves de descanso entre bloques.</li>
              <li>La duración estimada total es de 25 a 35 minutos.</li>
              <li>Puedes tomarte el tiempo que consideres necesario en cada decisión; no hay límite de tiempo por pregunta.</li>
            </ul>
          </div>

          {/* Sección 4 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">4. ¿Las decisiones involucran dinero real?</h4>
            <p className="text-slate-600">
              <strong className="text-slate-800">No.</strong> Todas las cantidades, fechas y elecciones presentadas en esta tarea son <strong className="text-slate-800">simulaciones hipotéticas</strong>. No recibirás ni perderás dinero real como resultado de tus respuestas.
            </p>
          </div>

          {/* Sección 5 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">5. ¿Existen riesgos o molestias por participar?</h4>
            <p className="text-slate-600">
              Esta tarea no implica ningún riesgo físico ni psicológico mayor al que podrías experimentar en cualquier actividad cotidiana frente a una pantalla. El único factor previsto que podría influir en tu decisión de abandonar la tarea es la <strong className="text-slate-800">fatiga</strong>, dado que requiere concentración sostenida. Puedes tomar pausas y retirarte del estudio en cualquier momento sin ninguna consecuencia.
            </p>
          </div>

          {/* Sección 6 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">6. ¿Cuáles son los beneficios de participar?</h4>
            <p className="text-slate-600">
              No existe una compensación económica ni un beneficio personal inmediato por tu participación. Tu colaboración contribuye de forma valiosa a la generación de conocimiento científico sobre los procesos de toma de decisiones intertemporales y el comportamiento financiero en población mexicana.
            </p>
          </div>

          {/* Sección 7 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">7. Confidencialidad y protección de datos</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong className="text-slate-800">Anonimato:</strong> no se te solicitará tu nombre completo ni datos bancarios. Cualquier identificador que proporciones se codifica internamente solo para fines de seguimiento y control de la muestra.</li>
              <li><strong className="text-slate-800">Uso exclusivo académico:</strong> los datos se utilizarán únicamente para fines de investigación, incluyendo la elaboración de una tesis de licenciatura en la UNAM y posibles publicaciones o ponencias científicas derivadas.</li>
              <li><strong className="text-slate-800">Presentación agregada:</strong> los resultados se reportarán siempre de forma global; bajo ninguna circunstancia se publicará información que permita identificarte individualmente.</li>
              <li><strong className="text-slate-800">Almacenamiento seguro:</strong> la información se guarda en bases de datos protegidas con acceso exclusivo para el equipo de investigación.</li>
            </ul>
          </div>

          {/* Sección 8 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">8. Participación voluntaria y derecho al retiro</h4>
            <p className="text-slate-600">
              Tu participación es completamente voluntaria. Eres libre de no participar o de interrumpir tu sesión en cualquier momento, cerrando la ventana del navegador, sin necesidad de justificar tu decisión y sin ninguna repercusión desfavorable. No obstante, tu contribución es muy valiosa, por lo que te pedimos leer y responder con cuidado cada pregunta si decides continuar.
            </p>
          </div>

          {/* Sección 9 */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">9. Contacto para dudas o aclaraciones</h4>
            <p className="text-slate-600">
              Si tienes preguntas sobre el procedimiento, tus derechos como participante, o deseas solicitar la eliminación de tu registro tras haber concluido, puedes escribir directamente a: <a href="mailto:moisesth55555@gmail.com" className="text-blue-600 font-semibold underline">moisesth55555@gmail.com</a>
            </p>
          </div>

          {/* Firma institucional */}
          <div className="pt-6 border-t border-slate-200">
            <p className="text-slate-600 text-xs italic mb-4">
              El Laboratorio de Comportamiento y Adaptación de la Facultad de Psicología agradece tu tiempo y participación.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
              <p className="font-bold text-slate-900">Moisés Torres Hernández</p>
              <p className="text-xs text-slate-600">Responsable de la investigación</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">moisesth55555@gmail.com</p>
            </div>
          </div>

          {/* DECLARACIÓN DE CONSENTIMIENTO */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 bg-blue-50/40 -mx-6 md:-mx-10 px-6 md:px-10 py-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
              <h3 className="font-serif font-bold text-slate-900 uppercase tracking-wide text-sm md:text-base">
                Declaración de Consentimiento Informado
              </h3>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-5 bg-white/80 p-4 rounded-xl border border-blue-100">
              Por medio de la presente, certifico que he sido informado(a) con la claridad y veracidad debidas respecto al estudio al que el investigador Moisés Torres Hernández me ha invitado a participar; que actúo de forma consciente, libre y voluntaria como colaborador(a), y que he comprendido que las decisiones presentadas son hipotéticas y no involucran dinero real.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs md:text-sm font-medium text-slate-800">
                  Declaro tener 18 años cumplidos o más.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsConfirmed}
                  onChange={(e) => setTermsConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs md:text-sm font-medium text-slate-800">
                  Acepto participar voluntariamente en este estudio.
                </span>
              </label>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onDecline}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
              >
                <XCircle className="w-4 h-4 text-slate-400" /> No deseo participar
              </button>

              <button
                type="button"
                onClick={onAccept}
                disabled={!canContinue}
                className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                  canContinue
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer hover:-translate-y-0.5'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <span>Continuar al Registro</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
