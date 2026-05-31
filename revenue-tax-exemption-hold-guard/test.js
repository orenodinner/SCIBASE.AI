"use strict";

const assert = require("assert");
const {
  analyzeTaxExemptionHolds,
  daysUntil,
  formatUsd,
  hasVatEvidence,
  lineTotalCents,
  taxableLineTotalCents,
} = require("./taxExemptionHoldGuard");
const { sampleInvoices } = require("./sampleInvoices");

assert.strictEqual(daysUntil("2026-06-30", "2026-05-31T00:00:00.000Z"), 30);
assert.strictEqual(formatUsd(123456), "$1234.56");
assert.strictEqual(lineTotalCents(sampleInvoices.invoices[0]), 1380000);
assert.strictEqual(taxableLineTotalCents(sampleInvoices.invoices[3]), 85000);
assert.strictEqual(hasVatEvidence({ vatId: "DE123456789" }), true);
assert.strictEqual(hasVatEvidence({}), false);

const packet = analyzeTaxExemptionHolds(sampleInvoices);
assert.strictEqual(packet.status, "hold");
assert.strictEqual(packet.summary.invoices, 5);
assert.strictEqual(packet.summary.release, 1);
assert.strictEqual(packet.summary.review, 2);
assert.strictEqual(packet.summary.hold, 2);

const expired = packet.decisions.find((item) => item.invoiceId === "inv-expired-certificate");
assert(expired);
assert.strictEqual(expired.decision, "hold");
assert(expired.findings.some((finding) => finding.code === "CERTIFICATE_EXPIRED"));

const missingVat = packet.decisions.find((item) => item.invoiceId === "inv-eu-missing-vat");
assert(missingVat);
assert.strictEqual(missingVat.decision, "hold");
assert(missingVat.findings.some((finding) => finding.code === "MISSING_VAT_EVIDENCE"));

const mixed = packet.decisions.find((item) => item.invoiceId === "inv-mixed-taxable-lines");
assert(mixed);
assert.strictEqual(mixed.decision, "review");
assert(mixed.findings.some((finding) => finding.code === "CERTIFICATE_EXPIRING_SOON"));
assert(mixed.findings.some((finding) => finding.code === "MIXED_TAXABLE_LINES"));

const clean = analyzeTaxExemptionHolds({
  checkedAt: "2026-05-31T08:55:00.000Z",
  invoices: [
    {
      id: "inv-clean",
      customer: "Clean Lab",
      country: "US",
      billingModel: "institutional_invoice",
      requestedTaxTreatment: "exempt",
      certificate: {
        id: "cert-clean",
        type: "state_exemption",
        status: "verified",
        expiresAt: "2027-01-01",
        jurisdiction: "US-WA",
      },
      purchaseOrder: { id: "PO-clean", taxTreatment: "exempt", jurisdiction: "US-WA" },
      lines: [{ id: "line-sub", category: "subscription", taxable: false, amountCents: 100000 }],
    },
  ],
});
assert.strictEqual(clean.status, "release");
assert.strictEqual(clean.summary.release, 1);

const empty = analyzeTaxExemptionHolds({ invoices: [] });
assert.strictEqual(empty.status, "release");
assert.strictEqual(empty.warnings[0].code, "NO_INVOICES");

console.log("revenue-tax-exemption-hold-guard tests passed");
