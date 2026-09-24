# AI setup

The existing Process Assistant now uses Groq to generate and edit real flowcharts. The layout, templates, manual editor, exports, and database schema are preserved.

## Enable the free API

1. Create a free Groq account and API key: https://console.groq.com/keys
2. Copy `.env.example` to `.env` in the project root. If `.env` already exists, add the AI settings without replacing your database settings.
3. Set `GROQ_API_KEY` to your key. Keep `AI_PROVIDER="groq"` and `GROQ_MODEL="openai/gpt-oss-20b"`.
4. Run `npm install`, `npx prisma generate`, and `npx prisma db push`. For a fresh demo database only, run `npm run prisma:seed`.
5. Start or restart with `npm run dev`. Open an editable process and describe the workflow in the existing chat.

Example: "Create an employee onboarding workflow. HR checks documents, IT provisions access, and the manager approves training. If documents are missing, return to the employee."

Follow-up: "Add finance approval before IT provisioning when equipment costs exceed $2,000."

The current diagram and up to eight recent messages are sent to Groq. Keep credentials in server environment variables; never use a NEXT_PUBLIC_ key. End users do not need their own API keys. Restart the server after changing provider settings.

## Free allowance and deployment

Groq has a rate-limited free plan; it is not unlimited access. All your users share your organization's allowance. Check current limits at https://console.groq.com/docs/rate-limits and your Groq account's Limits page. The app does not switch providers or upgrade plans automatically. Provider quota exhaustion produces a clear chat error and leaves the diagram unchanged.

The endpoint has a best-effort limit of 20 requests/minute per server instance and allows one pending request per process per instance. This is not a distributed or per-user quota system. The existing project has demo login without authenticated server sessions or tenant authorization. Before making this MVP publicly available, add verified sessions, process ownership checks, and a shared per-user limiter to protect business data and your shared API allowance. Those broader authentication changes are outside this AI integration.

Configure a hosting request timeout of at least 60 seconds. API calls time out after 45 seconds. No new runtime packages are required.

## Behavior

- Creates workflows and edits existing nodes, decisions, approvals, roles and SLAs through the existing chat.
- Uses the current diagram and recent conversation for follow-up requests.
- Validates JSON, node types, unique IDs, positions and edge endpoints before saving.
- Supports up to 60 nodes, 120 connections, and 4,000 characters per request.
- Automatically lays out topology changes; retains positions for text-only changes.
- Saves both messages and the generated diagram in one database transaction.
- Rejects edits to finalized processes and detects database changes during generation.
- Reports missing keys, quota limits, timeouts and invalid responses without revealing provider error details.
- Keeps the original preset service available only when explicitly setting `AI_PROVIDER="mock"`.

## Verification

Run `node tests/ai-integration.cjs` for the 10 provider/validation/API tests. These use simulated API and database responses, require no key, and are not a live-provider or real-database test.

Then run `npx prisma generate`, `npx tsc --noEmit`, and `npm run build` in your local environment. Add a real key and try the example and follow-up above. Reload the process to confirm persistence. Try an explanation-only question and verify the diagram remains unchanged.

## Changed files

- `src/lib/ai/groq-process-service.ts`: real server-side Groq adapter and flowchart prompt.
- `src/lib/ai/validation.ts`: safe errors and runtime graph validation.
- `src/lib/ai/process-service.ts`: Groq as default; explicit mock option.
- `src/lib/ai/types.ts`: optional conversation history.
- `src/app/api/ai/process-message/route.ts`: input checks, context, quota guard and transactional persistence.
- `src/components/process/ProcessChat.tsx`: useful error messages and input length limit.
- `.env.example`: AI configuration and SQLite URL matching the existing schema.
- `.gitignore`: excludes environment secrets.
- `tests/ai-integration.cjs`: key-free regression tests.
- `README.md` and `AI_SETUP.md`: setup instructions.

Provider references: https://console.groq.com/docs/structured-outputs and https://console.groq.com/docs/rate-limits

Verification in the editing environment: all 10 simulated integration tests passed; the new AI service modules passed strict TypeScript checking; Next.js production compilation succeeded. The full build/type check could not complete because Windows blocked child process creation (spawn EPERM), including Prisma client generation. Live Groq generation was not tested because no key was supplied.
