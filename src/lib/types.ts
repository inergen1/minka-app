export type Lang = "ar" | "en";
export type Text = { ar: string; en: string };
export type AreaId = string;
export type Slot = "fajr" | "morning" | "dhuhr" | "asr" | "maghrib" | "night" | "anytime";
export type Horizon = "year" | "quarter" | "month";

export interface Area {
  id: AreaId;
  icon: string;
  name: Text;
  now: number;
  before: number;
  vision: Text;
}

export type Frequency = { kind: "daily" } | { kind: "days"; days: number[] };

export interface Habit {
  id: string;
  area: AreaId;
  slot: Slot;
  icon: string;
  name: Text;
  type: "check" | "count" | "duration";
  target?: number;
  unit?: Text;
  freq?: Frequency;
  quit?: boolean;
  goal?: string | null;
}

export interface Goal {
  id: string;
  parent?: string;
  area: AreaId;
  horizon: Horizon;
  start: string;
  due: string;
  title: Text;
  why?: Text | null;
  metric?: { cur: number; target: number; unit: Text };
}

export interface Task {
  id: string;
  goal?: string | null;
  area?: AreaId;
  title: Text;
  done: boolean;
  due?: string;
}

/** Weekly recurring block (dows = JS getDay values) or a one-off block on a date. */
export interface Block {
  id: string;
  dows?: number[];
  date?: string;
  s: number;
  d: number;
  area: AreaId;
  title: Text;
  task?: string;
}

/** logs[habitId][yyyy-mm-dd] = value */
export type Logs = Record<string, Record<string, number>>;

export interface Review {
  week: string;
  notes: string[];
  top: string[];
  ratings: Record<AreaId, number>;
}
