"use strict";

const sampleInvoices = {
  checkedAt: "2026-05-31T08:55:00.000Z",
  policy: {
    expiryWarningDays: 30,
    taxableLineReviewThresholdCents: 25000,
  },
  invoices: [
    {
      id: "inv-clean-us-lab",
      customer: "Northlake Genomics Lab",
      country: "US",
      billingModel: "institutional_invoice",
      requestedTaxTreatment: "exempt",
      certificate: {
        id: "cert-us-2026-001",
        type: "state_exemption",
        status: "verified",
        expiresAt: "2027-04-30",
        jurisdiction: "US-MA",
      },
      purchaseOrder: {
        id: "PO-8842",
        taxTreatment: "exempt",
        jurisdiction: "US-MA",
      },
      lines: [
        { id: "line-sub", category: "subscription", description: "Institutional annual plan", taxable: false, amountCents: 1200000 },
        { id: "line-compute", category: "compute", description: "Reproducibility compute pack", taxable: false, amountCents: 180000 },
      ],
    },
    {
      id: "inv-expired-certificate",
      customer: "Bay Ridge Materials Center",
      country: "US",
      billingModel: "institutional_invoice",
      requestedTaxTreatment: "exempt",
      certificate: {
        id: "cert-us-2024-144",
        type: "state_exemption",
        status: "verified",
        expiresAt: "2026-04-15",
        jurisdiction: "US-CA",
      },
      purchaseOrder: {
        id: "PO-8120",
        taxTreatment: "exempt",
        jurisdiction: "US-CA",
      },
      lines: [
        { id: "line-sub", category: "subscription", description: "Lab annual plan", taxable: false, amountCents: 720000 },
      ],
    },
    {
      id: "inv-eu-missing-vat",
      customer: "Alpine Neuroimaging Institute",
      country: "DE",
      billingModel: "institutional_invoice",
      requestedTaxTreatment: "reverse_charge",
      certificate: {
        id: "cert-eu-2026-087",
        type: "vat_reverse_charge",
        status: "verified",
        expiresAt: "2026-12-31",
        jurisdiction: "EU",
      },
      purchaseOrder: {
        id: "PO-2239",
        taxTreatment: "reverse_charge",
        jurisdiction: "DE",
      },
      lines: [
        { id: "line-license", category: "analytics_license", description: "Research trend analytics API", taxable: false, amountCents: 460000 },
      ],
    },
    {
      id: "inv-mixed-taxable-lines",
      customer: "East Harbor Quant Lab",
      country: "US",
      billingModel: "institutional_invoice",
      requestedTaxTreatment: "exempt",
      certificate: {
        id: "cert-us-2026-212",
        type: "state_exemption",
        status: "verified",
        expiresAt: "2026-06-18",
        jurisdiction: "US-NY",
      },
      purchaseOrder: {
        id: "PO-3371",
        taxTreatment: "exempt",
        jurisdiction: "US-NY",
      },
      lines: [
        { id: "line-sub", category: "subscription", description: "Lab annual plan", taxable: false, amountCents: 900000 },
        { id: "line-training", category: "professional_services", description: "Onsite onboarding workshop", taxable: true, amountCents: 85000 },
      ],
    },
    {
      id: "inv-po-tax-conflict",
      customer: "Cedar Clinical Trials Office",
      country: "US",
      billingModel: "institutional_invoice",
      requestedTaxTreatment: "standard",
      certificate: null,
      purchaseOrder: {
        id: "PO-5581",
        taxTreatment: "exempt",
        jurisdiction: "US-TX",
      },
      lines: [
        { id: "line-compute", category: "compute", description: "Clinical reproducibility compute runs", taxable: true, amountCents: 320000 },
      ],
    },
  ],
};

module.exports = { sampleInvoices };
