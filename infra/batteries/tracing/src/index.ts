export const battery = { name: 'tracing', provides: ['tracing.read', 'tracing.span'], env: ['LANGSMITH_API_KEY', 'LANGSMITH_PROJECT'] } as const;
/** M-* metric ids Instrument fills from traces. Definitions: docs/07-assessment-and-measurement.md. */
export const METRICS = ['M-TOK', 'M-TURNS', 'M-ERR', 'M-HOT', 'M-REUSE', 'M-COST'] as const;
