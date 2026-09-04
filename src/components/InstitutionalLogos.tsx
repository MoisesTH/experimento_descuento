import React from 'react';

/**
 * Escudo Institucional de la Universidad Nacional Autónoma de México (UNAM)
 */
export function UnamLogo({ className = "w-20 h-24" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} title="Universidad Nacional Autónoma de México">
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-800"
      >
        <path
          d="M 100 10 C 135 10 170 15 180 30 C 185 85 185 140 100 228 C 15 140 15 85 20 30 C 30 15 65 10 100 10 Z"
          fill="#0B2341"
          stroke="#C49A45"
          strokeWidth="4"
        />
        <path
          d="M 100 18 C 130 18 162 22 170 35 C 174 82 174 132 100 215 C 26 132 26 82 30 35 C 38 22 70 18 100 18 Z"
          fill="#081A30"
          stroke="#C49A45"
          strokeWidth="1.5"
        />
        <path
          d="M 40 42 Q 100 32 160 42 Q 100 50 40 42 Z"
          fill="#C49A45"
        />
        <text
          x="100"
          y="43"
          textAnchor="middle"
          fontSize="6"
          fontWeight="bold"
          fill="#081A30"
          letterSpacing="0.5"
        >
          POR MI RAZA HABLARÁ EL ESPÍRITU
        </text>
        <g stroke="#C49A45" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M 75 75 Q 60 70 52 82 Q 62 85 70 80 Q 75 92 65 105" />
          <circle cx="68" cy="76" r="1.5" fill="#C49A45" />
          <path d="M 125 75 Q 140 70 148 82 Q 138 85 130 80 Q 125 92 135 105" />
          <circle cx="132" cy="76" r="1.5" fill="#C49A45" />
          <path d="M 45 100 Q 55 125 80 135" />
          <path d="M 155 100 Q 145 125 120 135" />
        </g>
        <path
          d="M 94 92 L 108 92 L 115 100 L 110 110 L 118 125 L 112 145 L 105 165 L 100 180 L 96 160 L 98 140 L 92 120 L 88 105 Z"
          fill="#C49A45"
          opacity="0.95"
        />
        <g stroke="#C49A45" strokeWidth="1" opacity="0.6">
          <line x1="100" y1="72" x2="100" y2="60" />
          <line x1="88" y1="74" x2="80" y2="64" />
          <line x1="112" y1="74" x2="120" y2="64" />
        </g>
        <path
          d="M 85 195 Q 100 185 115 195"
          stroke="#C49A45"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <span className="text-[10px] font-serif font-bold text-slate-700 tracking-wider mt-1 uppercase text-center">
        UNAM
      </span>
    </div>
  );
}

/**
 * Logotipo Oficial de la Facultad de Psicología de la UNAM
 */
export function PsicoUnamLogo({ className = "w-20 h-24" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} title="Facultad de Psicología - UNAM">
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-900"
      >
        <g fill="#0F172A">
          <rect x="71" y="10" width="18" height="95" rx="3" />
          <path d="M 28 20 C 28 55 42 76 71 78 L 71 63 C 54 61 46 48 46 20 Z" />
          <path d="M 132 20 C 132 55 118 76 89 78 L 89 63 C 106 61 114 48 114 20 Z" />
          <rect x="45" y="100" width="70" height="12" rx="2" />
        </g>
      </svg>
      <div className="text-center mt-0.5">
        <span className="block text-[11px] font-sans font-black text-slate-900 tracking-tight leading-none uppercase">
          Facultad
        </span>
        <span className="block text-[9px] font-sans font-semibold text-slate-600 tracking-wider leading-tight uppercase">
          de Psicología
        </span>
      </div>
    </div>
  );
}
