// Demo invoices (/demo and "Nueva factura de demo", #69 and #70) are numbered
// 1001, 1002… Real distributors and tests may use any number on the same
// contract (a test once made 998473), so the demo counts only within its own range.

export const DEMO_FIRST_ID = 1001n;
export const DEMO_LAST_ID = 99_999n;

/**
 * The next demo number after the highest one already used in the demo's range,
 * from the newest invoices the contract lists. Past the end of the range it
 * starts again at the beginning; the caller steps forward past numbers already taken.
 */
export function nextDemoId(ids: bigint[]): bigint {
  const inRange = ids.filter((id) => id >= DEMO_FIRST_ID && id <= DEMO_LAST_ID);
  const next = inRange.reduce((max, id) => (id > max ? id : max), DEMO_FIRST_ID - 1n) + 1n;
  return next > DEMO_LAST_ID ? DEMO_FIRST_ID : next;
}

/** From `start`, the first number that isn't taken, at most `maxSteps` on (null if all are taken). */
export async function firstFreeId(start: bigint, taken: (id: bigint) => Promise<boolean>, maxSteps = 50): Promise<bigint | null> {
  let id = start;
  for (let step = 0; step < maxSteps; step++, id = id >= DEMO_LAST_ID ? DEMO_FIRST_ID : id + 1n) {
    if (!(await taken(id))) return id;
  }
  return null;
}
