---
name: battery-tracing
description: LangSmith tracing for every 3PT harness iteration and the reader that turns traces into M-* measurements. Load when Instrument computes metrics or when a stage should emit spans.
---
# Battery: Tracing
Every stage run is one trace under `LANGSMITH_PROJECT`. Instrument reads the previous iteration's trace and writes `measurements` documents (atlas battery). Metric ids are `METRICS` here and defined in docs/07.
