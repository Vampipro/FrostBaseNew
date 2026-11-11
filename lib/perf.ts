/** Слабкий пристрій: телефон/тачскрін, мало ядер/RAM, економія трафіку, reduced-motion. */
export function detectWeak(): boolean {
  try {
    const n = navigator as any;
    const mq = (q: string) => !!window.matchMedia && matchMedia(q).matches;
    const small = mq("(max-width: 820px)") || mq("(pointer: coarse)");
    const rm = mq("(prefers-reduced-motion: reduce)");
    const save = n.connection?.saveData === true;
    const cores = n.hardwareConcurrency || 8;
    const mem = n.deviceMemory || 8;
    return small || rm || save || cores <= 2 || mem <= 2;
  } catch {
    return false;
  }
}

/** Середній FPS за ms мілісекунд (через requestAnimationFrame). */
export function measureFps(ms = 2000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;
    const tick = (t: number) => {
      if (document.hidden) return resolve(60); // вкладка у фоні — не судимо
      if (!start) start = t;
      frames++;
      if (t - start >= ms) return resolve((frames * 1000) / (t - start));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
