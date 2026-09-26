---
name: battery-blob
description: Where image bytes live for 3PT (gridfs inside the Atlas Sandbox by default; r2 or local fs alternatives). Tier metadata is in Atlas media_index; this battery only moves bytes. Load when a job needs to read or write an image.
---
# Battery: Blob
`BLOB_BACKEND=gridfs|r2|fs`. Default gridfs keeps every byte inside the Sandbox cluster. The read-once rule (docs/00-vision.md) means `blob.get` is called by the transcriber, never by Plan or Instrument.
