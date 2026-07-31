import { BlockData, Choice } from './types';

const c = (t: number, l: number): Choice => ({ today: t, later: l });

// Plan A & C are identical in the provided choices
const PLAN_A_BASE = (f: number) => [
  [c(190*f, 0), c(152*f, 40*f), c(114*f, 80*f), c(76*f, 120*f), c(38*f, 160*f), c(0, 200*f)], // AA
  [c(180*f, 0), c(144*f, 40*f), c(108*f, 80*f), c(72*f, 120*f), c(36*f, 160*f), c(0, 200*f)], // BA
  [c(170*f, 0), c(136*f, 40*f), c(102*f, 80*f), c(68*f, 120*f), c(34*f, 160*f), c(0, 200*f)], // CA
  [c(160*f, 0), c(128*f, 40*f), c(96*f, 80*f), c(64*f, 120*f), c(32*f, 160*f), c(0, 200*f)], // DA
  [c(140*f, 0), c(112*f, 40*f), c(84*f, 80*f), c(56*f, 120*f), c(28*f, 160*f), c(0, 200*f)], // EA
  [c(110*f, 0), c(88*f, 40*f), c(66*f, 80*f), c(44*f, 120*f), c(22*f, 160*f), c(0, 200*f)], // FA
];

// Plan B & D are identical in the provided choices
const PLAN_B_BASE = (f: number) => [
  [c(200*f, 0), c(160*f, 40*f), c(120*f, 80*f), c(80*f, 120*f), c(40*f, 160*f), c(0, 200*f)], // AB
  [c(190*f, 0), c(152*f, 40*f), c(114*f, 80*f), c(76*f, 120*f), c(38*f, 160*f), c(0, 200*f)], // BB
  [c(180*f, 0), c(144*f, 40*f), c(108*f, 80*f), c(72*f, 120*f), c(36*f, 160*f), c(0, 200*f)], // CB
  [c(150*f, 0), c(120*f, 40*f), c(90*f, 80*f), c(60*f, 120*f), c(30*f, 160*f), c(0, 200*f)], // DB
  [c(120*f, 0), c(96*f, 40*f), c(72*f, 80*f), c(48*f, 120*f), c(24*f, 160*f), c(0, 200*f)], // EB
  [c(90*f, 0), c(72*f, 40*f), c(54*f, 80*f), c(36*f, 120*f), c(18*f, 160*f), c(0, 200*f)], // FB
];

const PLAN_C_BASE = PLAN_A_BASE;
const PLAN_D_BASE = PLAN_B_BASE;

const AMOUNTS = [
  { label: 'Pequeñas', value: 200, factor: 1 },
  { label: 'Medianas', value: 2000, factor: 10 },
  { label: 'Grandes', value: 20000, factor: 100 }
];

const DELAY_PLANS = [
  { text1: 'Hoy', text2: 'En 5 semanas', id: 'd1', plan: PLAN_A_BASE },
  { text1: 'Hoy', text2: 'En 9 semanas', id: 'd2', plan: PLAN_B_BASE },
  { text1: 'En 5 semanas', text2: 'En 10 semanas', id: 'd3', plan: PLAN_C_BASE },
  { text1: 'En 5 semanas', text2: 'En 14 semanas', id: 'd4', plan: PLAN_D_BASE }
];

export const STIMULI_GROUPS: Record<string, BlockData[]> = AMOUNTS.reduce((acc, amt) => {
  acc[amt.label] = DELAY_PLANS.map(delay => ({
    id: `block-${amt.value}-${delay.id}`,
    title: `Bono total a distribuir: $${amt.value.toLocaleString()}`,
    delayText: `${delay.text1} vs ${delay.text2}`,
    rows: delay.plan(amt.factor).map((choices, i) => ({
      id: `${String.fromCharCode(65 + i)}-${amt.value}-${delay.id}`,
      choices
    }))
  }));
  return acc;
}, {} as Record<string, BlockData[]>);

