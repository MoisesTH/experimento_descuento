export interface Choice {
  today: number;
  later: number;
}

export interface RowData {
  id: string;
  choices: Choice[];
}

export interface BlockData {
  id: string;
  title: string;
  delayText: string;
  rows: RowData[];
}

export type Screen = 'setup' | 'instructions' | 'example' | 'comprehension' | 'ready' | 'task' | 'feedback' | 'finished';
