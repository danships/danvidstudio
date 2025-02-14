export function throttleCallback<T extends unknown[]>(callback: (...arguments_: T) => void, delay: number) {
  let lastCall = 0;
  return (...arguments_: T) => {
    const now = Date.now();
    if (now - lastCall > delay) {
      lastCall = now;
      callback(...arguments_);
    }
  };
}
