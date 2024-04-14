/**
 * Sleep for a given amount of time in milliseconds
 * @param timeMs Time to sleep in milliseconds
 */
export async function sleep(timeMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeMs))
}

/**
 * Logs the text to the console
 * @param text Text to log
 */
export function log(text: string): void {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}]: ${text}`)
}
