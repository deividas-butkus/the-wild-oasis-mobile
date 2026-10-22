// A record that doesn't exist (or isn't visible under RLS). Not worth retrying.
export class NotFoundError extends Error {
  name = "NotFoundError";
}

// Compares by name: `instanceof` is unreliable for transpiled subclasses of Error
export function isNotFound(error: unknown) {
  return error instanceof Error && error.name === "NotFoundError";
}
