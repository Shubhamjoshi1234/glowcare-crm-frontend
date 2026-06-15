# GlowCare Frontend

The frontend is a standalone React 19 and Vite application for the GlowCare
marketing CRM. It talks only to the CRM API; the browser never calls the channel
simulator or OpenAI directly.

This directory is self-contained and can be published as its own GitHub
repository.

## Start Locally

Requirements:

- Node.js 20.19 or newer
- npm
- CRM API running on port `4000`

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

The only frontend environment variable is public by design:

```env
VITE_CRM_API_URL=http://localhost:4000
```

Do not add API keys or other secrets to any `VITE_` variable. Vite embeds those
values in the browser bundle.

## Product Flow

1. **Dashboard** gives a compact operational overview and service status.
2. **Customers** supports server-backed search and filters, with a detailed
   shopper profile showing contact information, orders, and communication
   history.
3. **Orders** supports product, customer, category, and date filtering.
4. **Audiences** offers AI-ranked audience suggestions and a manual builder.
   Every suggestion is editable and verified against the live audience before it
   is saved.
5. **Campaigns** compares product performance, proposes editable campaign
   directions, and creates draft campaigns.
6. **Campaign detail** launches the campaign and polls the CRM while asynchronous
   channel receipts update recipient states and analytics.
7. **Analytics** compares catalog performance across daily and weekly views.

## Application Structure

```text
src/
  components/   Shared layout, UI primitives, audience insights, shopper profile
  lib/          API client and display formatting
  pages/        Route-level workflows
  app.tsx       Route definitions
  types.ts      API-facing domain types
```

TanStack Query owns server state, caching, refetching, and mutations. Local React
state is limited to page filters, draft forms, and view preferences. The shared
API client normalizes JSON errors into `ApiError` instances for consistent UI
handling.

## Production Build

```bash
npm ci
npm run build
```

Deploy the generated `dist` directory to a static host:

```text
Project root:    frontend
Install command: npm ci
Build command:   npm run build
Output folder:   dist
```

Set `VITE_CRM_API_URL` to the public CRM API URL before building. Restart the
Vite development server after changing environment values.

`public/_redirects` and `vercel.json` preserve React Router paths such as
`/segments` and `/campaigns/:id` when opened directly.

## Verification

```bash
npm run lint
npm test
npm run build
```

The frontend intentionally contains no provider credentials, direct messaging
integration, sales pipeline, support inbox, or chatbot workflow.
