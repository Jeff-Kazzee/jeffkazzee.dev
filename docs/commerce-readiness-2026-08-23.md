# Commerce readiness

Status: preparation only. The site does not have a product catalog, checkout,
order service, or paid API yet.

## What the site can sell today

The current commercial path is the `/work-with-me/` page. It offers focused
websites, small tools, and AI workflows. A buyer starts by email. Jeff scopes
the work before quoting a price or taking payment.

This path lets buyers contact Jeff without requiring a product catalog or checkout.

The previous coaching-session checkout and booking links are intentionally
retired because coaching is not part of the current offer. Add a direct payment
path only after the service, price, availability, delivery terms, and refund
terms are current and verified.

## The first product contract

Add a product to the site only after you know these fields:

- `id`: stable internal identifier
- `slug`: stable public path
- `title`: customer-facing name
- `description`: what the buyer receives
- `kind`: download, access, service, or subscription
- `price`: integer in the currency's smallest unit
- `currency`: ISO 4217 code
- `availability`: draft, available, sold out, or retired
- `fulfillment`: how the buyer receives the purchase
- `checkoutUrl`: live checkout created by the payment provider

Use this record as the source for the product page, structured data, checkout,
and any later API. Do not copy prices or availability into several files.

## Build order

1. Choose one real product and write its delivery and refund terms.
2. Add the product record and a public product page.
3. Connect a hosted checkout or a small server-side checkout route.
4. Test payment, receipt, failure, refund, and fulfillment paths.
5. Add `Product` and `Offer` structured data from the same record.
6. Add an order or catalog API only when another client needs it.
7. Publish agent discovery and payment metadata only for the live API.

## Agent commerce boundary

x402, MPP, UCP, and ACP describe working payment or commerce services. A
well-known file cannot create those services. Keep their routes absent until
the site can verify payment, create an order, fulfill it, and report failure.

The protocol research and future route requirements live in
[`research/agent-readiness-2026-08-23.md`](research/agent-readiness-2026-08-23.md).

## Launch gate

Before publishing the first product, verify these facts:

- The checkout amount and currency match the product page.
- The buyer receives a receipt.
- Fulfillment works without a manual database edit.
- Refund and support terms are visible before payment.
- Taxes and business details match the countries where you sell the product.
- Analytics do not collect payment details or private customer data.

Do not treat a successful checkout link as customer demand. Track purchases,
refunds, delivery failures, and repeat buyers separately.
