export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

/**
 * Current `Y-m-d H:i:s`
 */
export function currentYMDHIS(): string {
  return formatDate(new Date())
}
