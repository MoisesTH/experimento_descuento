import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UnamLogo, PsicoUnamLogo } from './InstitutionalLogos';

interface DeclinedScreenProps {
  onReturnToConsent: () => void;
}

export function DeclinedScreen({ onReturnToConsent }: DeclinedScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-12"
    >
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border border-slate-200 p-8 md:p-10 text-center">
        <div className="flex items-center justify-center gap-6 mb-6 opacity-75">
          <UnamLogo className="w-12 h-14" />
          <div className="h-8 w-px bg-slate-200" />
          <PsicoUnamLogo className="w-12 h-14" />
        </div>

        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-600">
          <CheckCircle2 className="w-7 h-7 text-slate-500" />
        </div>

        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-3">
          Agradecemos tu tiempo y consideración
        </h2>

        <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-6">
          Has decidido no participar en esta ocasión. Respetamos plenamente tu decisión. 
          <strong className="block text-slate-800 mt-2 font-medium">
            No se ha recopilado ni guardado ninguna información personal ni respuestas.
          </strong>
        </p>

        <p className="text-xs text-slate-400 mb-8">
          Puedes cerrar esta pestaña o ventana del navegador con total tranquilidad.
        </p>

        <div className="pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onReturnToConsent}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Si cambiaste de opinión, volver al consentimiento
          </button>
        </div>
      </div>
    </motion.div>
  );
}
