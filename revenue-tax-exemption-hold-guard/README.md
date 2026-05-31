# Revenue Tax Exemption Hold Guard

This is a self-contained Revenue Infrastructure slice for issue #20.

The guard checks whether institutional invoices that request tax-exempt or reverse-charge treatment can be released before billing. It validates exemption certificate freshness, VAT or jurisdiction evidence, PO tax terms, mixed taxable line items, and remediation actions for subscription, compute, and analytics-license revenue.

## Scope

- Synthetic data only.
- No network calls, credentials, payment processor integration, tax filing, bank data, or SCIBASE production service integration.
- Focused on institutional tax/VAT exemption release safety, not broad billing ledgers, usage metering, receipt privacy, refunds, cancellation, dunning, sanctions screening, support entitlement, collections, or analytics seat rosters.

## Validation

```sh
node revenue-tax-exemption-hold-guard/test.js
node revenue-tax-exemption-hold-guard/demo.js
```

The demo writes deterministic reviewer artifacts under `revenue-tax-exemption-hold-guard/reports/`.

Reviewer artifacts:

- `reports/tax-exemption-packet.json`
- `reports/tax-exemption-report.md`
- `reports/summary.svg`
- `reports/demo.mp4`
