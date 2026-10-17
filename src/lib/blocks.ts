import { key } from "./dates";
import type { Block } from "./types";

export const blocksOn = (blocks: Block[], d: Date) =>
  blocks.filter((b) => (b.dows ? b.dows.includes(d.getDay()) : b.date === key(d))).sort((a, b) => a.s - b.s);
