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

# 2. Push database schema and seed initial processes
npx prisma db push
node prisma/seed.js

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Demo Credentials & Seed Data

On the login screen (`/login`), click **"Sign In with Demo Consultant Account"** or use:
- **Email**: `alex@jvprocess.com`
- **Role**: Senior Process Consultant
- **Organization**: Acme Global Enterprises

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

