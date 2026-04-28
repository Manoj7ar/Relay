# Demo video script (~3 minutes)

> **Note:** This script matches the **current** Relay build: real mic/STT/TTS/camera, local Patient Dictionary in IndexedDB, multimodal fusion through Ollama, and a tool-calling handover agent when the selected local model supports tools. There is **no** Demo mode or Judge Demo route. Align any recording with README’s canonical status table.

| Time | Audio / voiceover | Screen |
|------|-------------------|--------|
| 0:00–0:20 | Cold open: a new agency carer meets a patient whose personal signals are not obvious. Relay’s promise: the patient’s communication corpus stays on the phone. | Caregiver → Dictionary tab with saved signals |
| 0:20–0:55 | Patient gives a partial sound plus camera context. Relay fuses channels and answers from the Patient Dictionary: “wants water,” including the “Learned from this patient” badge. | Home: camera on, mic flow, compound input card |
| 0:55–1:25 | Carer confirms a new signal and taps “Save this as a new patient signal.” Show add-entry sheet with meaning and tags, then Dictionary list. | Home feedback → Dictionary |
| 1:25–1:55 | Show model routing: compound signals route to 27B; dictionary match IDs are visible as learned context, not a mock answer. | Caregiver → Routing |
| 1:55–2:30 | End of shift: tap “Generate handover.” Let judges see live tool calls: session history, dictionary deltas, alert log, routing log, pattern summary, write note. | Caregiver → Handover |
| 2:30–2:50 | **Honesty beat:** stop Ollama or use an unreachable URL; interpretation/agent generation surfaces the real error, while Dictionary browsing still works locally. | Home error + Caregiver Dictionary |
| 2:50–3:00 | Close: local-first patient corpus, explicit export/import for transfer, no cloud upload by default. | README implementation status |

**Do not claim:** cloud sync, background distress monitoring, patient-driven inversion, mock STT, stub TTS, or Judge Demo — those are **not** in this build.

**Capture notes:** 1080p if possible; show **ConnectionBadge** (Ollama vs network) and **routing log**; keep tab bar readable.
