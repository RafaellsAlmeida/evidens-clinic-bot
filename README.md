# Evidens Clinic Bot

## Overview
Evidens Clinic Bot is an AI-powered WhatsApp assistant for clinic intake, patient triage, scheduling support, and intelligent human handoff.

## Problem
Clinics lose leads and overload staff when first-contact conversations, FAQs, and scheduling triage are handled manually.

## Solution
This platform centralizes patient messaging, automates first response and qualification, and routes complex cases to human staff with context.

## Architecture
- `client/`: React frontend for dashboard and simulator views.
- `server/`: Node.js API, bot orchestration, and integration endpoints.
- `shared/`: shared types and cross-layer utilities.
- `drizzle/`: schema and migration assets.
- `docs/runbooks/`: operational setup notes.

## Tech Stack
- React + TypeScript + Vite
- Node.js + Express + tRPC
- Supabase + Drizzle ORM
- OpenAI API and external messaging integrations

## Setup
1. Install dependencies: `pnpm install`
2. Copy env template: `cp .env.example .env`
3. Run development server: `pnpm dev`
4. Run type-check/tests: `pnpm check && pnpm test`

## Results
- Faster first response for inbound WhatsApp leads.
- Reduced repetitive scheduling and FAQ workload.
- Better continuity between AI conversations and human handoff.

## Screenshots
Add production screenshots under `docs/screenshots/` and link them here.

## Tradeoffs
- AI quality depends on prompt/config tuning and operational guardrails.
- Real-time integrations require strict credential and webhook reliability management.

## Additional Docs
- Webhook setup: `docs/runbooks/webhook-setup.md`
- Backlog notes: `docs/archive/todo.md`
