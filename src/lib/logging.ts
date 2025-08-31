function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`[error] ${error.name}: ${error.message}`);
  } else {
    console.error('[error] caught an unknown error:', error);
  }
}

export default { logError };
