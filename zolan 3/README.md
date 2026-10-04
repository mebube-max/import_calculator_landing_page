# Zolan China Import Profit Calculator

Vinext / React site, Cloudflare Workers API and durable D1 lead persistence. Cabinet Grotesk and the supplied PNG brand assets are bundled locally. The deployed Site starts owner-private; public advertising launch requires explicitly changing its audience.

## Routes
- `/tools/china-import-profit-calculator`: landing page (also available at `/`).
- `/tools/china-import-profit-calculator/calculate`: server-gated calculator.
- `/tools/china-import-profit-calculator/guide`: practical input checklist.

## Run locally
Node 22.13+, pnpm and Python 3 for the integration suite.

1. Run the Sites `install-dependencies.mjs` helper from this directory.
2. Run the Sites `build-site.mjs` helper to emit local Worker configuration.
3. Apply the migration:
   `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_early_miracleman.sql`
4. `pnpm run dev` serves at http://127.0.0.1:5173.
5. `pnpm exec tsc --noEmit` and `node --experimental-strip-types --test tests/*.test.mjs`.
6. With the local server running, `python3 tests/access.integration.py`. It uses only local D1 and restores its temporary schema rename in a finally block. Do not run against production.

## Storage and access
`.openai/hosting.json` declares `DB`; Sites provisions the hosted D1 binding and applies the tracked migration on deployment. Local development uses a separate persistent local D1 database. This is real storage, not a discarded-email development adapter.

The server normalizes email, performs an idempotent lead upsert and stores consent, timestamp, first form/source, attribution and page/consent versions. It atomically persists an opaque token hash with the lead before issuing an HttpOnly SameSite=Lax cookie (Secure on HTTPS). Raw email is never put in a token or access URL. Tokens are random and stored hashed; this equivalent server-issued gate is only for tool access, never private financial records. Browser-local financial saves are independent of the email gate.

`ACCESS_DAYS` is an optional runtime variable, default 30. Entering the email again restores expired access. Access-link recovery is available when transactional delivery is configured. CSRF origin checks, an invisible honeypot and a database-backed limit of 20 valid capture attempts per IP per hour protect the endpoint. D1 limits store a hash of the IP/window, not raw IP. Periodic database retention cleanup should be added to the team's operational jobs, including expired access and limit rows.

## Transactional email adapter
`lib/email.ts` is the replaceable adapter. The implementation uses Resend over HTTP. Set secret runtime `EMAIL_API_KEY` and nonsecret `EMAIL_FROM` (a verified sender) through Sites environment variables, then deploy a saved version to apply them. Do not store credentials in source or client code. Without those values, lead capture and immediate browser access still work; no email delivery is claimed. The form wording accurately describes this. Provider errors and timeouts return false, log no email address and never prevent access after durable capture. Restore access by entering the email again; there is no resend UI.

No marketing sequence is activated. The unchecked opt-in is stored using `tips-v1`: “Email me practical China-import tips and updates about Zolan supplier payments.” A future marketing/CRM adapter must honour this flag, retain consent evidence and implement unsubscribe before sending campaigns.

## Analytics
First-party aggregate funnel events go to D1 via `/api/events`. Only an explicit event allowlist and sanitized UTM strings are accepted; no email address, calculator inputs, supplier details or financial notes are sent. Acquisition attribution persists in sessionStorage between the landing and calculator. Supplier payment link selection is a click event, never treated as a submitted enquiry or qualified lead. CRM enrichment for enquiry submission, qualification and first funded payment is not connected. Integrate the organization's approved consent/analytics workflow before connecting third-party analytics.

## Calculation fixture
100 bags at ¥40 × ₦220 = ₦880,000 supplier cost. China-side costs ₦40,000 + freight ₦500,000 + import/clearing ₦200,000 + local delivery ₦40,000 = ₦1,660,000 shipment cash. All 100 bags are sellable: ₦16,600 landed cost. ₦25,000 selling price minus ₦4,000 selling costs minus ₦16,600 landed = ₦4,400 contribution (17.6%). Cash recovery is ceil(₦1,660,000 / (₦25,000 − ₦4,000)) = 80 sales. Contribution and gross profit are before business taxes and financing. Fixed operating costs are optional and used only for the batch operating estimate. No live FX or official customs assessment is supplied.

No existing application or calculator source was supplied in this workspace. The included calculator implements the described estimates; integrate it with an existing tool if a larger calculator PRD exists elsewhere.

## Content and links
`lib/content.ts` contains version identifiers, approved consent copy and experimental headlines/CTAs. Hero composition and section content are in `app/landing.tsx`. Typography and responsive layouts are in `app/globals.css`. All sample outputs use the same calculation fixture. Repeated forms share input and submission state. Privacy and Terms link to verified `https://usezolan.com/privacy` and `/terms`; the guide is an implemented local route. Supplier-payment action links to `https://usezolan.com`.

## Launch requirements
- Configure and verify the transactional email provider/sender; actual external email delivery has not been exercised without credentials.
- Connect the approved CRM if lead qualification/customer conversion reporting is required; durable lead persistence already works with D1.
- Confirm the existing Zolan privacy notice covers this calculator's collection and retention policy, and set operational retention/cleanup.
- Configure public audience and production domain only when the owner requests public launch.
- If integrating into an existing Zolan app, provide that repository and the full calculator PRD to preserve broader existing behavior.

## Verification
Production build and TypeScript check; 8 automated calculator/email-adapter tests; local D1 integration tests for capture, no-consent access, duplicates, origin checks, bot trap, opaque tokens, capture failure, expiry recovery and rate limits. Browser checks cover invalid input, keyboard submission, immediate calculator navigation, returning access, local financial save and layout at desktop and 320px. Production external delivery and CRM operations require configuration and are not claimed tested.
