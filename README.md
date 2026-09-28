# JV Process — AI-Assisted Business Process Mapping Platform (MVP)

A modern B2B SaaS web application for business consultants and enterprise teams to design, map, iterate, and document operational workflows using natural language conversation and an interactive visual flowchart editor.

---

## 1. Features & Capabilities

- **AI Conversation Assistant**: Conversational process elicitation with structured visual flowchart synthesis and proactive step suggestions.
- **Interactive Process Canvas**: Powered by React Flow (`@xyflow/react`) supporting custom BPMN-style node types:
  - `Start Node`: Pill-shaped process intake / trigger.
  - `Task Node`: Standard operational card with SLA timers and assigned roles.
  - `Approval Node`: Distinct amber review gate with SLA and role constraints.
  - `Decision Node`: Diamond rule diamond with branching conditions.
  - `End Node`: Terminal state.
- **Canvas Operations**: Drag-and-drop, connection validation, snap-to-grid, auto-layout (Dagre hierarchical top-down / left-right), zoom in/out, fit to view, minimap, and undo/redo history stack.
- **Node Parameter Inspector**: Real-time side drawer to configure step name, type, role, SLA, required flags, and conditional rules with live autosave.
- **Governance & Versioning**: Version history timeline, milestone snapshots, structural diff comparison (Added, Modified, Removed), and 1-click version restore.
- **Process Finalization**: Formal approval lock workflow with celebration triggers.
- **Documentation & Executive Export**:
  - Structured Standard Operating Procedure (SOP) view with participant matrix and step tables.
  - **PNG Export**: High-resolution canvas capture.
  - **PDF Export**: Formatted executive document export.
- **Templates Library**: Pre-mapped operational starter workflows (Order-to-Cash, Employee Onboarding, Procure-to-Pay, Contract Lifecycle).

---

## 2. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Diagramming**: `@xyflow/react` (React Flow), Dagre (Auto-layout).
- **Backend**: Next.js App Router API Route Handlers.
- **Database**: Prisma ORM with SQLite (local development zero-config) / PostgreSQL compatibility.
- **Export Engine**: `html2canvas` and `jspdf`.

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Installation & Launch

```bash
# 1. Copy .env.example to .env and add your GROQ_API_KEY (see AI_SETUP.md)
# Install dependencies
npm install

# 2. Apply the database schema (preserves existing records)
npx prisma db push

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. User Accounts & Private Flowcharts

Open /login and choose **Create an account**. Each user supplies their name, email, and a password of 12-128 characters. Passwords are salted and hashed with scrypt. Random session tokens are stored in HttpOnly cookies; only token hashes are saved in the database. Sessions expire after seven days and are revoked on sign-out.

Flowcharts are assigned to the signed-in creator on the server. Owners can click Share in the flowchart workspace and enter a registered user email with Can view or Can edit permission. Shared flowcharts appear in the recipient dashboard. Viewers can read and export; editors can modify the diagram, metadata, participants, messages, versions, and AI edits. Only creators can manage sharing or delete the entire flowchart. Owners can change or remove access; subsequent server requests enforce the new permission. Editing the display owner or adding participants does not grant access. Sharing does not send email or provide simultaneous live editing.

After updating the code, run `npx prisma db push` and `npx prisma generate` before starting the app. Existing records are preserved: old users without password hashes cannot sign in, and old flowcharts without a creator stay hidden. An administrator must verify ownership before assigning legacy charts to a registered user by setting Process.creatorId. Do not infer access rights from editable owner names or emails.

The optional seed script **replaces all existing data**. For a disposable demo database, set SEED_PASSWORD to a unique password of at least 12 characters before running it. The seeded login email is alex@jvprocess.com, and its charts belong only to that account. Do not run the seed script on an existing user database.

### Pre-Seeded Workflows:
1. **Order Management**: Multi-step flow featuring intake, sales order, manager approval, high-value order decision branch (> $10k), finance approval, inventory allocation, and dispatch.
2. **Sales Process**: Finalized/Approved end-to-end commercial pipeline.
3. **Purchase Process**: Procurement governance and 3-way match invoice process.

---

## 5. AI Service Integration

The Process Assistant uses the Groq API by default. See [AI_SETUP.md](AI_SETUP.md) for free-key setup, environment settings, limitations, and tests. The original preset service is available with AI_PROVIDER=mock.

---

## 6. Project Structure

```text
src/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── processes/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── versions/
│   │       └── documentation/
│   ├── templates/
│   ├── settings/
│   └── api/
│       ├── ai/process-message/
│       ├── auth/
│       └── processes/
├── components/
│   ├── canvas/nodes/
│   ├── layout/
│   ├── process/
│   └── ui/
├── lib/
│   ├── ai/
│   ├── db/
│   ├── process/
│   └── utils.ts
└── prisma/
    ├── schema.prisma
    └── seed.js
```


### Account isolation regression test

With the development server on port 3100, run `node --env-file=.env scripts/test-user-isolation.cjs`. Set TEST_BASE_URL to use another local port. This creates two temporary accounts, checks access restrictions, and removes its test data. Use a development database.

### Voice and document input

In a draft flowchart, use **Voice** to dictate into the AI chat draft, then stop recording and review the transcript before sending. Voice requires a browser with SpeechRecognition support, microphone permission, and HTTPS (or localhost). Recognition uses the browser speech service and browser language; the app does not store audio. Typing and document import remain available when speech recognition is unsupported.

Use **Import document** for PDF, DOCX, UTF-8 TXT, Markdown, or CSV. Limits: 4 MB per file, 30 PDF pages, and 20,000 extracted characters; the combined chat draft can contain 24,000 characters. Imports append editable text to the draft; nothing is sent to the AI until Send is pressed. Original files are not stored. Extracted text is included in the saved chat and sent to the configured AI provider when submitted. Image-only/scanned PDFs need OCR elsewhere; legacy .doc files are not supported. Owners and editors can import into editable flowcharts; viewers cannot.
