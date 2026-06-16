// ─────────────────────────────────────────────────────────────────────────────
//  Invoice PDF / Print Utility
//  Opens a styled receipt in a new window and triggers the browser print dialog.
//  The user can then "Save as PDF" from the print dialog.
//  No external library required.
// =============================================================================

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

const fmtDateTime = () =>
  new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })

// ─────────────────────────────────────────────────────────────────────────────
function buildHTML(inv, org = {}) {
  // Org fields with sensible fallbacks
  const O = {
    name:    org.orgName    || 'Your Organisation',
    tagline: org.orgTagline || '',
    gstin:   org.gstin      || '',
    pan:     org.pan        || '',
    cin:     org.cin        || '',
    addr:    [org.address, org.city, org.state, org.pincode].filter(Boolean).join(', ') || '',
    phone:   org.phone      || '',
    email:   org.email      || '',
    bank:    org.bankName   || '',
    acct:    org.bankAccount|| '',
    ifsc:    org.bankIfsc   || '',
    branch:  org.bankBranch || '',
  }

  const taxAmt      = inv.amount && inv.tax     ? (inv.amount * inv.tax / 100) : 0
  const discountAmt = inv.discount || 0
  const isPaid      = inv.paymentStatus === 'Paid'
  const docTitle    = isPaid ? 'RECEIPT' : 'TAX INVOICE'

  const statusBox = `
    <span style="display:inline-block;border:2px solid #000;padding:3px 14px;font-size:11pt;font-weight:bold;letter-spacing:1px;">
      ${esc(inv.paymentStatus?.toUpperCase())}
    </span>`

  const paymentSection = (inv.paymentMethod || inv.transactionId || inv.paymentDate) ? `
    <div class="section-label">Payment Details</div>
    <table class="detail-table">
      ${inv.paymentMethod  ? `<tr><td class="detail-key">Payment Mode</td><td class="detail-val">${esc(inv.paymentMethod)}</td></tr>` : ''}
      ${inv.transactionId  ? `<tr><td class="detail-key">Transaction / Ref ID</td><td class="detail-val"><span style="font-family:monospace;">${esc(inv.transactionId)}</span></td></tr>` : ''}
      ${inv.paymentDate    ? `<tr><td class="detail-key">Payment Date</td><td class="detail-val">${fmtDate(inv.paymentDate)}</td></tr>` : ''}
    </table>` : ''

  const notesSection = inv.notes ? `
    <div class="section-label">Notes</div>
    <p style="font-size:10pt;font-style:italic;color:#333;margin-bottom:14px;">${esc(inv.notes)}</p>` : ''

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(inv.invoiceNumber)} — ${esc(O.name)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    @media print {
      @page { size: A4 portrait; margin: 14mm 16mm 18mm; }
      body  { font-size: 10.5pt; }
      .no-print { display: none !important; }
      .page { max-width: none; padding: 0; margin: 0; }
    }

    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 28px 32px 24px;
    }

    /* ── Company header ── */
    .co-header {
      text-align: center;
      padding-bottom: 14px;
      border-bottom: 3px double #000;
      margin-bottom: 0;
    }
    .co-name    { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; }
    .co-tagline { font-size: 9.5pt; color: #333; margin-top: 2px; }
    .co-detail  { font-size: 9pt;   color: #444; margin-top: 1px; }

    /* ── Document title band ── */
    .doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 5px;
      text-transform: uppercase;
      padding: 8px 0;
      border-bottom: 1px solid #000;
      margin-bottom: 14px;
    }

    /* ── Meta strip (invoice no. + date + status) ── */
    .meta-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 24px;
      padding: 10px 0;
      border-bottom: 1px solid #ccc;
      margin-bottom: 14px;
    }
    .meta-row { display: flex; gap: 8px; font-size: 10.5pt; }
    .meta-key { color: #555; min-width: 105px; flex-shrink: 0; }
    .meta-val { font-weight: bold; }

    /* ── Status badge row ── */
    .status-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 14px;
    }

    /* ── Bill-to / Service two-col ── */
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      padding: 10px 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      margin-bottom: 14px;
    }
    .party-name { font-size: 12.5pt; font-weight: bold; margin-bottom: 4px; }

    /* ── Section label ── */
    .section-label {
      font-size: 8.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #333;
      border-bottom: 1.5px solid #000;
      padding-bottom: 3px;
      margin: 14px 0 8px;
    }

    /* ── Detail key-value table ── */
    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    .detail-table td { font-size: 10.5pt; padding: 2px 0; vertical-align: top; }
    .detail-key { color: #555; width: 160px; }
    .detail-val { font-weight: 600; }

    /* ── Charges table ── */
    .charges-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    .charges-table thead tr {
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
    }
    .charges-table th {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      text-align: left;
    }
    .charges-table td { padding: 7px 8px; font-size: 10.5pt; border-bottom: 1px solid #ddd; }
    .charges-table .amt { text-align: right; white-space: nowrap; }
    .charges-table .sub-row td { color: #444; font-size: 10pt; }
    .charges-table .total-row td {
      font-size: 12pt;
      font-weight: bold;
      border-top: 2px solid #000;
      border-bottom: 3px double #000;
      padding: 8px 8px;
    }

    /* ── Signature row ── */
    .sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      margin-bottom: 16px;
    }
    .sig-block { text-align: center; width: 180px; }
    .sig-line  { border-top: 1px solid #000; padding-top: 4px; font-size: 9pt; color: #333; }

    /* ── Footer ── */
    .receipt-footer {
      text-align: center;
      font-size: 8.5pt;
      color: #444;
      border-top: 1px dashed #777;
      padding-top: 10px;
      margin-top: 10px;
    }

    /* ── Print button ── */
    .print-btn {
      display: block;
      margin: 24px auto 0;
      padding: 10px 32px;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 3px;
      font-size: 12pt;
      font-family: sans-serif;
      cursor: pointer;
      letter-spacing: 0.5px;
    }
    .print-btn:hover { background: #222; }
  </style>
</head>
<body>
<div class="page">

  <!-- ── Company header ── -->
  <div class="co-header">
    <div class="co-name">${esc(O.name)}</div>
    ${O.tagline ? `<div class="co-tagline">${esc(O.tagline)}</div>` : ''}
    ${(O.gstin || O.pan || O.cin) ? `<div class="co-detail">${[O.gstin && `GSTIN: ${esc(O.gstin)}`, O.pan && `PAN: ${esc(O.pan)}`, O.cin && `CIN: ${esc(O.cin)}`].filter(Boolean).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</div>` : ''}
    ${O.addr  ? `<div class="co-detail">${esc(O.addr)}</div>` : ''}
    ${(O.phone || O.email) ? `<div class="co-detail">${[O.phone && `Tel: ${esc(O.phone)}`, O.email && `Email: ${esc(O.email)}`].filter(Boolean).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</div>` : ''}
  </div>

  <!-- ── Document title ── -->
  <div class="doc-title">${docTitle}</div>

  <!-- ── Invoice meta + status ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px;">
    <div class="meta-strip" style="flex:1;border:none;padding:0;margin:0;">
      <div>
        <div class="meta-row"><span class="meta-key">Invoice No.</span><span class="meta-val">${esc(inv.invoiceNumber)}</span></div>
        <div class="meta-row"><span class="meta-key">Invoice Type</span><span class="meta-val">${esc(inv.invoiceType)}</span></div>
        <div class="meta-row"><span class="meta-key">Invoice Date</span><span class="meta-val">${fmtDate(inv.createdAt)}</span></div>
      </div>
      <div>
        <div class="meta-row"><span class="meta-key">Period From</span><span class="meta-val">${fmtDate(inv.periodFrom)}</span></div>
        <div class="meta-row"><span class="meta-key">Period To</span><span class="meta-val">${fmtDate(inv.periodTo)}</span></div>
        <div class="meta-row"><span class="meta-key">Next Renewal</span><span class="meta-val">${fmtDate(inv.periodTo)}</span></div>
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0;">${statusBox}</div>
  </div>

  <!-- ── Bill To / Service Details ── -->
  <div class="party-grid">
    <div>
      <div style="font-size:8.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#333;margin-bottom:6px;">Bill To</div>
      <div class="party-name">${esc(inv.customer?.businessName || inv.customer?.name || '—')}</div>
      ${inv.customer?.businessName ? `<div style="font-size:10.5pt;margin-bottom:2px;">${esc(inv.customer.name)}</div>` : ''}
      <table class="detail-table" style="margin-top:4px;">
        ${inv.customer?.phone ? `<tr><td class="detail-key">Phone</td><td>${esc(inv.customer.phone)}</td></tr>` : ''}
        ${inv.customer?.email ? `<tr><td class="detail-key">Email</td><td>${esc(inv.customer.email)}</td></tr>` : ''}
      </table>
    </div>
    <div>
      <div style="font-size:8.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#333;margin-bottom:6px;">Service Details</div>
      <table class="detail-table">
        <tr><td class="detail-key">Software</td><td class="detail-val">${esc(inv.software?.name || '—')}</td></tr>
        ${inv.software?.type ? `<tr><td class="detail-key">Type</td><td>${esc(inv.software.type)}</td></tr>` : ''}
        ${inv.subscription?.billingCycle ? `<tr><td class="detail-key">Billing Cycle</td><td>${esc(inv.subscription.billingCycle)}</td></tr>` : ''}
        <tr><td class="detail-key">Renewal Date</td><td>${fmtDate(inv.periodTo)}</td></tr>
      </table>
    </div>
  </div>

  <!-- ── Charges ── -->
  <div class="section-label">Charges</div>
  <table class="charges-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="amt">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${esc(inv.software?.name || 'Software Subscription')} &mdash; ${esc(inv.invoiceType)}</td>
        <td class="amt">${fmtINR(inv.amount)}</td>
      </tr>
      ${taxAmt > 0 ? `
      <tr class="sub-row">
        <td>GST / Tax &nbsp;(${inv.tax}%)</td>
        <td class="amt">+ ${fmtINR(taxAmt)}</td>
      </tr>` : ''}
      ${discountAmt > 0 ? `
      <tr class="sub-row">
        <td>Discount</td>
        <td class="amt">&minus; ${fmtINR(discountAmt)}</td>
      </tr>` : ''}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>TOTAL AMOUNT ${isPaid ? 'PAID' : 'PAYABLE'}</td>
        <td class="amt">${fmtINR(inv.totalAmount)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ── Payment Details ── -->
  ${paymentSection}

  <!-- ── Bank Details (if configured) ── -->
  ${(O.bank || O.acct || O.ifsc) ? `
  <div class="section-label">Bank Details</div>
  <table class="detail-table">
    ${O.bank   ? `<tr><td class="detail-key">Bank Name</td><td class="detail-val">${esc(O.bank)}</td></tr>` : ''}
    ${O.acct   ? `<tr><td class="detail-key">Account No.</td><td class="detail-val" style="font-family:monospace;">${esc(O.acct)}</td></tr>` : ''}
    ${O.ifsc   ? `<tr><td class="detail-key">IFSC Code</td><td class="detail-val" style="font-family:monospace;">${esc(O.ifsc)}</td></tr>` : ''}
    ${O.branch ? `<tr><td class="detail-key">Branch</td><td>${esc(O.branch)}</td></tr>` : ''}
  </table>` : ''}

  <!-- ── Notes ── -->
  ${notesSection}

  <!-- ── Signature area ── -->
  <div class="sig-row">
    <div class="sig-block">
      <div style="height:40px;"></div>
      <div class="sig-line">Customer Signature</div>
    </div>
    <div class="sig-block" style="text-align:right;">
      <div style="font-size:9pt;color:#333;margin-bottom:4px;">For ${esc(O.name)}</div>
      <div style="height:30px;"></div>
      <div class="sig-line">Authorised Signatory</div>
    </div>
  </div>

  <!-- ── Footer ── -->
  <div class="receipt-footer">
    <div>This is a computer-generated ${isPaid ? 'receipt' : 'invoice'} and does not require a physical signature.</div>
    <div style="margin-top:3px;">Thank you for your business! &nbsp;&mdash;&nbsp; ${esc(O.name)}</div>
    <div style="margin-top:2px;color:#777;">Generated on ${fmtDateTime()} &nbsp;|&nbsp; ${esc(inv.invoiceNumber)}</div>
  </div>

  <!-- ── Print button (hidden in print) ── -->
  <button class="print-btn no-print" onclick="window.print()">
    &#128438;&nbsp; Print / Save as PDF
  </button>

</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public API
// =============================================================================
export function downloadInvoicePdf(inv, orgSettings = {}) {
  const html = buildHTML(inv, orgSettings)
  const win  = window.open('', '_blank', 'width=820,height=1000,scrollbars=yes')
  if (!win) {
    alert('Popup blocked. Please allow popups for this site to download invoices.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  // Auto-trigger print after fonts/styles settle
  setTimeout(() => win.print(), 600)
}
