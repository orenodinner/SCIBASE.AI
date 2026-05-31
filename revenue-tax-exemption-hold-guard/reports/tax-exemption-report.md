# Revenue Tax Exemption Hold Guard

Status: **hold**

## Summary

- Invoices checked: 5
- Release: 1
- Review: 2
- Hold: 2
- Invoice amount reviewed: $38650.00
- Taxable line amount: $4050.00

## Decisions

- inv-clean-us-lab: release (none)
- inv-expired-certificate: hold (CERTIFICATE_EXPIRED)
- inv-eu-missing-vat: hold (MISSING_VAT_EVIDENCE)
- inv-mixed-taxable-lines: review (CERTIFICATE_EXPIRING_SOON, MIXED_TAXABLE_LINES)
- inv-po-tax-conflict: review (PO_TAX_TREATMENT_CONFLICT)

## Scope

This guard supports SCIBASE revenue operations by holding or routing institutional tax-exempt and reverse-charge invoices before billing release when exemption evidence, VAT evidence, PO terms, certificate freshness, or mixed taxable lines need attention.
