export function throttleCallback<T extends unknown[]>(callback: (...args: T) => void, delay: number) {
  let lastCall = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall > delay) {
      lastCall = now;
      callback(...args);
    }
  };
}
