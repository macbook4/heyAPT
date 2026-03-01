type LogMeta = Record<string, unknown> | undefined;

/**
 * Writes informational logs for app-level events.
 */
export function info(message: string, meta?: LogMeta): void {
  if (meta) {
    console.info(message, meta);
    return;
  }
  console.info(message);
}

/**
 * Writes warning logs for recoverable issues.
 */
export function warn(message: string, meta?: LogMeta): void {
  if (meta) {
    console.warn(message, meta);
    return;
  }
  console.warn(message);
}

/**
 * Writes error logs for non-recoverable issues.
 */
export function error(message: string, meta?: LogMeta): void {
  if (meta) {
    console.error(message, meta);
    return;
  }
  console.error(message);
}
