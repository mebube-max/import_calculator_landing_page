# Zolan China-to-Nigeria import calculator

A browser-local calculator built in TypeScript and Vite, with decimal.js for financial arithmetic. No account, backend, live FX feed or payment integration is required.

## Local preview in Chrome

On this Mac, double-click `Start Zolan Calculator.command`, keep its Terminal window open, then open http://127.0.0.1:5174/ in Chrome. On any machine with Node.js, run `npm start` to serve the included production build. A localhost address requires this server to be running; it is not a hosted customer URL.

## Run

Requires Node.js 22.12 or newer and npm (or pnpm).

```sh
npm install
npm run dev
npm test
npm run build
```

`dist/` contains the production website. Serve it with a web server, rather than opening index.html directly. `npm run dev` prints the local preview URL.

## Deploy

Upload the contents of `dist/` to a static host. Configure the public route `/tools/china-import-profit-calculator` to serve `index.html`, with asset requests resolving from `/assets/`. For hosting under a subdirectory instead, set Vite's `base` option to that path and rebuild. Configure the canonical URL in `index.html` for the real production route. Nothing has been published by this build.

Set the Zolan destination and article URL in `src/config.ts`. The article link is a configured integration destination; its availability has not been confirmed. The supplied Zolan logo and brand colours are included. The existing email-access app supplied Cabinet Grotesk font files, now bundled locally; no external font service is required.

## Features

- Blank and explicitly labelled illustrative-example flows.
- CNY, USD and NGN cost entry; shared or separate supplier rates.
- Separate supplier fees, all-in rates and total-NGN payment modes.
- Sellable quantities and a rounded inventory-loss helper.
- Shipment categories, custom charges and inclusive logistics quotes, with overlap blocking.
- Batch/per-ordered-unit costs and percentages based on invoice, selected rows or manual customs base.
- Independent customs conversion rates, recoverable tax portions and cycle validation.
- Air weight and sea volume freight helpers with explicit application and stale suggestions.
- Fixed/percentage selling expenses, return helper and target contribution pricing.
- Single-product operating forecast, stock-limited cash recovery and cash shortfall.
- Combined stress and up to three editable scenarios.
- Explicit browser saves, duplicate/load/delete, Excel (.xlsx) report download, copy fallback and print stylesheet.
- Responsive sections, labelled fields, validation messages and keyboard-accessible native dialogs.

## Calculation assumptions

All rates and charges are user quotes or assumptions. No statutory rates or customs classification are inferred. All financial calculations retain 40 significant digits internally. Display rounds to two decimals; target pricing rounds upward to the nearest kobo. Quantity bounds are 1 through 1,000,000. Individual entered amounts are limited to 1 trillion and converted cost rows are bounded at ₦1 trillion.

Landing cash includes all taxes paid. Economic landed cost subtracts the user-confirmed recoverable tax portion. Economic cost is spread over sellable stock. Damaged inventory is not charged a second time. Contribution deducts economic unit cost and selling expenses; it is not net profit. Operating costs stay outside inventory cost. Cash recovery uses full upfront cash, with immediate receipts and no restocking. It does not assume tax recovery timing.

Blank shipment categories are unknown and make estimates provisional. Explicit zero, not applicable and inclusion in a quote remain distinct. Included row values are retained but excluded from arithmetic. Tax estimates use selected dependencies or an explicit manual base; cycles block results. Revenue expenses may exceed 100%, yielding meaningful losses and warnings.

## Architecture

`src/engine.ts`: typed model, pure calculation functions, decimal parsing, fixture, scenarios, shipping and schema validation.

`src/main.ts`: progressive form, reactive summaries, local persistence, import preview, exports and accessible confirmations.

`src/style.css`: brand layout, responsive rules and print formatting.

`src/config.ts`: configurable links and disabled analytics adapter. Connect a privacy-compatible analytics implementation here if required; never send financial values, descriptions or notes.

## Simplicity update

The default opens “Your goods” with quantity and an authoritative full naira supplier payment. “Getting them to Nigeria” accepts shipping and another-cost total; “Selling them” accepts selling price and selling expenses. Optional disclosures retain the original detailed charges, supplier rates, taxes, freight helpers, selling fees, scenarios and operating forecasts. Only cost per item and contribution dominate the results panel.

Simple totals and detailed rows are exclusive representations, retaining inactive values. Combined quotes require explicit review of ambiguous overlapping totals. Unknown costs remain visibly provisional. Switching back to total-only entry requires reviewing the retained value; no artificial component breakdown is created.

## Verification

21 automated tests pass: 20 engine/report groups and a production-bundle DOM interaction test. Coverage includes the golden fixture, fees and all-in modes, simple/detail exclusivity, quote inclusions/overlap, invalid/unknown costs, sellable quantity, USD/CNY scenarios, recovery timing, legacy-save migration, report safety, progressive navigation, help, named saves, reload and reset. `npm test` builds before exercising the compiled UI.

TypeScript validation and production builds pass for the standalone calculator and the existing email-access application. Browser QA confirmed the example, two-answer panel, accessible help and Escape/focus restoration. Desktop and 320-pixel responsive layouts were inspected, including the mobile help sheet. Automated checks verify unique IDs, input labels and validation states; this is a focused accessibility check, not a full screen-reader audit.

The verified sample: ₦1,660,000 upfront, ₦16,600 per sellable item, ₦4,000 selling expenses, ₦4,400 contribution, 17.60% margin and 80 cash-recovery sales.

## Existing email-access application

The separately built access application keeps its landing, durable email capture, access API and server cookie check. Its protected calculator route renders this same compiled calculator in an accessible same-origin frame, isolating its styles. No public calculator HTML entry is added to that application. Anonymous requests redirect to the landing page; the existing authenticated browser session opens the updated calculator directly. Browser-local saves remain scoped to that application's origin.

To sync future updates to that React application:

```sh
npm run build:access -- /absolute/path/to/access-project
```

Then run that application's production build. The standalone Vite package is a public calculator preview; use the updated access application if the email gate is required. That application's existing Cloudflare/D1 hosting and email-provider configuration are still required. This release does not convert its backend to Vercel.

## Limits

No GitHub push or hosted deployment was performed in this update. Live rates, official customs assessment, payments and cloud financial storage are outside the calculator. Excel reports contain numeric result cells, order details and assumptions. JSON backup/import and CSV downloads have been removed from the customer interface. Workbook structure and figures were checked with an independent reader; production-domain download/print behavior remains to be verified. A final printed PDF and a full screen-reader audit have not been verified. Existing email-provider credentials and hosted D1 setup remain deployment dependencies.

## Vercel deployment

Commit `vercel.json` beside `package.json`. This specifies Vite, npm installation, the build command and dist output, and maps the calculator tool route to index.html. In Vercel, Root Directory must be the directory containing package.json: use ./ if source files are at the repository root, or zolan-calculator if that folder was uploaded as a wrapper. Redeploy after committing the config. A successful local build does not verify a remote deployment.

## Results decision support

“Your order at a glance” keeps cost per sellable item and contribution prominent, with whole-naira display and a semantic selling-price breakdown. Minimum cost-covering and target-margin prices come from the same engine, round upward to the nearest kobo and stay unavailable when selling expenses are unknown. Missing shipment costs label pricing provisional. Target pricing lives in one inline panel and stores the existing target input; applying it updates the authoritative selling price while preserving focus.

Full-sell-through and lower-price panels are optional. The lower-price comparison starts 10% below the current price, recalculates percentage fees through the scenario engine, and never applies itself or changes saved inputs. Copy/Excel/print include the comparison when its panel is open, alongside relevant assumptions and missing costs. Detailed cash recovery and operating planning remain separate. New tests cover these outputs, percentage fees, rounding, unknown versus confirmed zero costs, negative outcomes, recoverable tax and apply/focus behavior. Desktop and 320-pixel mobile views, including keyboard help dismissal, were inspected.
