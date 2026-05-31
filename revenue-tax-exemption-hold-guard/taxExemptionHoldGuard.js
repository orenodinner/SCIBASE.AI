"use strict";

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(dateValue, nowValue) {
  const date = parseDate(dateValue);
  const now = new Date(nowValue);
  if (!date || Number.isNaN(now.getTime())) {
    return null;
  }
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

function lineTotalCents(invoice) {
  return (invoice.lines || []).reduce((sum, line) => sum + Number(line.amountCents || 0), 0);
}

function taxableLineTotalCents(invoice) {
  return (invoice.lines || [])
    .filter((line) => line.taxable)
    .reduce((sum, line) => sum + Number(line.amountCents || 0), 0);
}

function hasVatEvidence(invoice) {
  return Boolean(invoice.vatId || invoice.taxRegistrationId || invoice.reverseChargeEvidenceId);
}

function evaluateInvoice(invoice, context) {
  const policy = context.policy;
  const findings = [];
  const taxTreatment = normalizeText(invoice.requestedTaxTreatment);
  const poTaxTreatment = normalizeText(invoice.purchaseOrder?.taxTreatment);
  const certificate = invoice.certificate;
  const country = String(invoice.country || "").toUpperCase();
  const taxableCents = taxableLineTotalCents(invoice);

  if ((taxTreatment === "exempt" || taxTreatment === "reverse_charge") && !certificate) {
    findings.push({
      code: "MISSING_EXEMPTION_EVIDENCE",
      severity: "hold",
      message: `${invoice.id} requests ${taxTreatment} treatment without a certificate or evidence record.`,
    });
  }

  if (certificate) {
    const days = daysUntil(certificate.expiresAt, context.checkedAt);
    if (normalizeText(certificate.status) !== "verified") {
      findings.push({
        code: "CERTIFICATE_NOT_VERIFIED",
        severity: "hold",
        message: `${invoice.id} has certificate ${certificate.id} but it is not verified.`,
      });
    }
    if (days !== null && days < 0) {
      findings.push({
        code: "CERTIFICATE_EXPIRED",
        severity: "hold",
        message: `${invoice.id} certificate ${certificate.id} expired ${Math.abs(days)} days before billing review.`,
      });
    } else if (days !== null && days <= policy.expiryWarningDays) {
      findings.push({
        code: "CERTIFICATE_EXPIRING_SOON",
        severity: "review",
        message: `${invoice.id} certificate ${certificate.id} expires in ${days} days.`,
      });
    }
  }

  if (taxTreatment === "reverse_charge") {
    if (!EU_COUNTRIES.has(country)) {
      findings.push({
        code: "REVERSE_CHARGE_JURISDICTION_MISMATCH",
        severity: "hold",
        message: `${invoice.id} requests reverse-charge treatment outside a supported EU jurisdiction.`,
      });
    }
    if (!hasVatEvidence(invoice)) {
      findings.push({
        code: "MISSING_VAT_EVIDENCE",
        severity: "hold",
        message: `${invoice.id} is missing VAT or reverse-charge evidence for institutional billing.`,
      });
    }
  }

  if (poTaxTreatment && poTaxTreatment !== taxTreatment) {
    findings.push({
      code: "PO_TAX_TREATMENT_CONFLICT",
      severity: taxTreatment === "standard" ? "review" : "hold",
      message: `${invoice.id} PO tax treatment is ${poTaxTreatment}, but invoice requests ${taxTreatment}.`,
    });
  }

  if (taxableCents > 0 && (taxTreatment === "exempt" || taxTreatment === "reverse_charge")) {
    findings.push({
      code: "MIXED_TAXABLE_LINES",
      severity: taxableCents >= policy.taxableLineReviewThresholdCents ? "review" : "note",
      message: `${invoice.id} contains ${formatUsd(taxableCents)} in taxable lines under ${taxTreatment} treatment.`,
    });
  }

  const blockers = findings.filter((finding) => finding.severity === "hold");
  const reviews = findings.filter((finding) => finding.severity === "review");
  const decision = blockers.length > 0 ? "hold" : reviews.length > 0 ? "review" : "release";

  return {
    invoiceId: invoice.id,
    customer: invoice.customer,
    billingModel: invoice.billingModel,
    requestedTaxTreatment: invoice.requestedTaxTreatment,
    amountCents: lineTotalCents(invoice),
    taxableCents,
    decision,
    findings,
    remediation: remediationFor(decision, findings),
  };
}

function remediationFor(decision, findings) {
  if (decision === "release") {
    return ["Release invoice with current exemption evidence packet."];
  }
  return findings
    .filter((finding) => finding.severity === "hold" || finding.severity === "review")
    .map((finding) => {
      if (finding.code === "CERTIFICATE_EXPIRED") return "Request renewed exemption certificate before invoice release.";
      if (finding.code === "MISSING_VAT_EVIDENCE") return "Collect validated VAT ID or reverse-charge evidence before release.";
      if (finding.code === "MIXED_TAXABLE_LINES") return "Route taxable line items to finance review before final tax treatment.";
      if (finding.code === "PO_TAX_TREATMENT_CONFLICT") return "Resolve PO and invoice tax-treatment mismatch with finance operations.";
      if (finding.code === "CERTIFICATE_EXPIRING_SOON") return "Confirm certificate remains valid for service period and archive renewal task.";
      return "Attach missing tax evidence and rerun the hold guard.";
    });
}

function analyzeTaxExemptionHolds(input) {
  const policy = {
    expiryWarningDays: input.policy?.expiryWarningDays ?? 30,
    taxableLineReviewThresholdCents: input.policy?.taxableLineReviewThresholdCents ?? 25000,
  };
  const checkedAt = input.checkedAt || new Date().toISOString();
  const invoices = input.invoices || [];
  const decisions = invoices.map((invoice) => evaluateInvoice(invoice, { checkedAt, policy }));
  const summary = {
    invoices: decisions.length,
    release: decisions.filter((item) => item.decision === "release").length,
    review: decisions.filter((item) => item.decision === "review").length,
    hold: decisions.filter((item) => item.decision === "hold").length,
    totalAmountCents: decisions.reduce((sum, item) => sum + item.amountCents, 0),
    taxableAmountCents: decisions.reduce((sum, item) => sum + item.taxableCents, 0),
  };

  return {
    status: summary.hold > 0 ? "hold" : summary.review > 0 ? "review" : "release",
    checkedAt,
    policy,
    summary,
    decisions,
    warnings: invoices.length === 0 ? [{ code: "NO_INVOICES", message: "No invoices were available for tax exemption review." }] : [],
  };
}

function formatUsd(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

module.exports = {
  analyzeTaxExemptionHolds,
  daysUntil,
  evaluateInvoice,
  formatUsd,
  hasVatEvidence,
  lineTotalCents,
  normalizeText,
  taxableLineTotalCents,
};
