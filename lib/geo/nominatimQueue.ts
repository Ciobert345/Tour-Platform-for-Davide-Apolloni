let chain: Promise<void> = Promise.resolve();
let lastAt = 0;
const MIN_GAP_MS = 1100;

/** Serializza le chiamate e rispetta max 1 richiesta/secondo verso Nominatim. */
export function enqueueNominatim<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastAt));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastAt = Date.now();
    return fn();
  });
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
