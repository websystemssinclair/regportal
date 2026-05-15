# Schedule Builder: fetch unfiltered sections, filter client-side in Web Worker

The Schedule Builder fetches all Sections for the student's selected Courses in one unfiltered batch, then applies modality/location/day-time filters inside a Web Worker before running the combination algorithm. Although the backend API supports filter query params, the student's section payload is tiny (~31 sections max for a 7-course list, ~15KB), so there is no meaningful bandwidth cost to fetching unfiltered. The benefit is that filter changes re-run the worker instantly — no re-fetch, no "Build" click required — making the filter UI feel responsive. Pre-fetch filtering would couple every filter change to a network round-trip and degrade the iterative UX.

## Considered Options

- **Pre-fetch filtering** (pass filter params to API) — rejected because it forces a full re-fetch on every filter change, adding latency to a tight iterative loop
- **Client-side filtering in Web Worker** (chosen) — negligible payload, instant filter re-runs, simpler API contract
