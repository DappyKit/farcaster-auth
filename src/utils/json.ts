/**
 * Safely parse a JSON string into an object
 * @param jsonString The JSON string to parse
 * @param errorExplanation The explanation to include in the error message if the JSON string is invalid
 */
export function safeJsonParse(jsonString: string, errorExplanation: string): unknown {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    throw new Error(`${errorExplanation}: ${(error as Error).message}`)
  }
}
