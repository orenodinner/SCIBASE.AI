"use strict";

const fs = require("fs");
const path = require("path");
const { analyzeTaxExemptionHolds, formatUsd } = require("./taxExemptionHoldGuard");
const { sampleInvoices } = require("./sampleInvoices");

const reportsDir = path.join(__dirname, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const packet = analyzeTaxExemptionHolds(sampleInvoices);
fs.writeFileSync(
  path.join(reportsDir, "tax-exemption-packet.json"),
  JSON.stringify(packet, null, 2) + "\n",
);

const report = [
  "# Revenue Tax Exemption Hold Guard",
  "",
  `Status: **${packet.status}**`,
  "",
  "## Summary",
  "",
  `- Invoices checked: ${packet.summary.invoices}`,
  `- Release: ${packet.summary.release}`,
  `- Review: ${packet.summary.review}`,
  `- Hold: ${packet.summary.hold}`,
  `- Invoice amount reviewed: ${formatUsd(packet.summary.totalAmountCents)}`,
  `- Taxable line amount: ${formatUsd(packet.summary.taxableAmountCents)}`,
  "",
  "## Decisions",
  "",
  ...packet.decisions.map((item) => {
    const codes = item.findings.map((finding) => finding.code).join(", ") || "none";
    return `- ${item.invoiceId}: ${item.decision} (${codes})`;
  }),
  "",
  "## Scope",
  "",
  "This guard supports SCIBASE revenue operations by holding or routing institutional tax-exempt and reverse-charge invoices before billing release when exemption evidence, VAT evidence, PO terms, certificate freshness, or mixed taxable lines need attention.",
  "",
].join("\n");

fs.writeFileSync(path.join(reportsDir, "tax-exemption-report.md"), report);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#132018"/>
  <text x="56" y="78" fill="#ffffff" font-family="Arial" font-size="34" font-weight="700">Revenue tax exemption hold guard</text>
  <text x="56" y="130" fill="#9ee493" font-family="Arial" font-size="24">Status: ${packet.status.toUpperCase()}</text>
  <rect x="56" y="178" width="190" height="118" rx="8" fill="#203a2a"/>
  <text x="86" y="228" fill="#ffffff" font-family="Arial" font-size="42">${packet.summary.invoices}</text>
  <text x="86" y="266" fill="#c8d8cc" font-family="Arial" font-size="19">invoices checked</text>
  <rect x="276" y="178" width="190" height="118" rx="8" fill="#183a30"/>
  <text x="306" y="228" fill="#ffffff" font-family="Arial" font-size="42">${packet.summary.release}</text>
  <text x="306" y="266" fill="#bdded4" font-family="Arial" font-size="19">release</text>
  <rect x="496" y="178" width="190" height="118" rx="8" fill="#3b3318"/>
  <text x="526" y="228" fill="#ffffff" font-family="Arial" font-size="42">${packet.summary.review}</text>
  <text x="526" y="266" fill="#f2dc92" font-family="Arial" font-size="19">review</text>
  <rect x="716" y="178" width="190" height="118" rx="8" fill="#3a1f27"/>
  <text x="746" y="228" fill="#ffffff" font-family="Arial" font-size="42">${packet.summary.hold}</text>
  <text x="746" y="266" fill="#f0b7c0" font-family="Arial" font-size="19">hold</text>
  <text x="56" y="370" fill="#dbe7dd" font-family="Arial" font-size="22">Checks exemption certificates, VAT evidence, PO tax terms, certificate expiry, and mixed taxable lines.</text>
  <text x="56" y="416" fill="#dbe7dd" font-family="Arial" font-size="22">Reviewed invoice amount: ${formatUsd(packet.summary.totalAmountCents)}</text>
</svg>
`;
fs.writeFileSync(path.join(reportsDir, "summary.svg"), svg);

console.log(report);
