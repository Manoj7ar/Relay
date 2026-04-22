# Relay — hackathon delivery package

## High-level file tree

```
Relay/
├── DELIVER.md                 ← this file
├── LICENSE
├── README.md                  ← canonical “Implementation status” table
├── SUBMISSION_SUMMARY.md
├── TECHNICAL_WRITEUP.md
├── VIDEO_SCRIPT.md            ← optional; may be gitignored for your fork
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GEMMA_AND_INTEGRATIONS.md
│   └── README.md
├── public/
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── components/
    ├── contexts/
    ├── hooks/
    ├── lib/
    ├── pages/
    ├── services/
    └── types/
```

## Real vs stubbed (summary) — must match README

| Capability | In this repo | Production next step |
|------------|----------------|----------------------|
| Mic + audio level | **Real** (`getUserMedia` + Web Audio) | — |
| STT | **Real** (Web Speech where supported) | Server STT fallback optional |
| TTS | **Real** (`speechSynthesis`) | Custom voices / policies |
| Camera | **Real** (preview + frame to session) | — |
| Permissions | **Real** | — |
| `chooseModel` | **Real** (pure rules) | Optional learned router (Cactus) |
| Gemma inference | **Real** via **Ollama** `localhost:11434` when up | Hosted fallback, auth |
| Emergency | **Real** when proxy URL + phone set | Harden proxy + Twilio |
| Twilio test SMS | **Stub** (throws) | Proxy + credentials server-side |
| SmartThings | **Stub** (throws) | OAuth + REST proxy |

Full detail: **README.md** (canonical table) and **docs/GEMMA_AND_INTEGRATIONS.md**.

## Pre-submission checklist (human)

- [ ] `npm run typecheck` and `npm run build` succeed.
- [ ] **Ollama**: `ollama serve` + models pulled for your **Settings → Models** tags.
- [ ] Walk **Home**: mic or type → interpretation + TTS + routing log line (no fake text on Ollama failure).
- [ ] **Caregiver**: history, routing filter, handover export if needed for your story.
- [ ] **Settings → Integrations**: document that emergency only works with your proxy; SMS/ST stubs expected.
- [ ] Record video using **VIDEO_SCRIPT.md** — only show flows that exist in **this** build (no Demo/Judge mode).
- [ ] Paste or adapt **SUBMISSION_SUMMARY.md** into the hackathon form.
- [ ] Verify **LICENSE** and README links for your fork.
