export const battery = { name: 'tracing', provides: ['tracing.read', 'tracing.span'], env: ['LANGSMITH_API_KEY', 'LANGSMITH_PROJECT'] } as const;
/** M-* metric ids Instrument fills from traces. Definitions: docs/07-assessment-and-measurement.md. */
export const METRICS = ['M-TOK', 'M-TURNS', 'M-ERR', 'M-HOT', 'M-REUSE', 'M-COST', 'M-K-EXEC', 'M-K-OPEN', 'M-K-REREAD', 'M-K-CONN', 'M-K-CONN-UNKNOWN'] as const;   // M-K-*: the signals battery, source 'kernel' (docs/20)
