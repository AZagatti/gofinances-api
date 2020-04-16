declare module 'util' {
  function promisify<T>(fn: T): Function;
}
