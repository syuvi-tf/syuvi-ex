function logError(error: unknown) {
  if (error instanceof Error) {
    console.error(`[ERROR] ${error.name}: ${error.message}`);
  } else {
    console.error('[ERROR] caught an unknown error:', error);
  }
}

export default { logError };
