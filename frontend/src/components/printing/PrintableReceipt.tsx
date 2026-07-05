import type { Payment, ReceiptPayload } from "../../types";

const paymentLabels: Record<Payment["method"], string> = {
  CASH: "نقدي",
  CARD: "بطاقة",
  WALLET: "محفظة",
};

type PrintableReceiptProps = {
  payload: ReceiptPayload;
};

export function PrintableReceipt({ payload }: PrintableReceiptProps) {
  const settings = payload.receiptSettings;
  const storeName = settings.storeName || payload.store.name;
  const storePhone = settings.storePhone || payload.store.phone;
  const storeAddress = settings.storeAddress || payload.branch.address || payload.store.address;
  const isA4 = settings.paperSize === "A4";

  return (
    <article className={`print-area receipt-paper receipt-${settings.paperSize.toLowerCase()}`} dir="rtl">
      <header className="receipt-header">
        {settings.showLogo && settings.logoUrl && <img src={settings.logoUrl} alt={storeName} className="receipt-logo" />}
        {settings.showLogo && !settings.logoUrl && <div className="receipt-logo-placeholder">{storeName.slice(0, 1)}</div>}
        <h2>{storeName}</h2>
        {settings.receiptHeader && <p>{settings.receiptHeader}</p>}
        {storePhone && <p>{storePhone}</p>}
        {storeAddress && <p>{storeAddress}</p>}
        {settings.showTaxNumber && (settings.taxNumber || payload.store.taxNumber) && <p>الرقم الضريبي: {settings.taxNumber || payload.store.taxNumber}</p>}
      </header>

      <section className={isA4 ? "receipt-meta receipt-meta-a4" : "receipt-meta"}>
        <span>فاتورة: {payload.invoice.invoiceNumber}</span>
        <span>{formatDateTime(payload.invoice.createdAt)}</span>
        {settings.showBranchName && <span>الفرع: {payload.branch.name}</span>}
        {settings.showCashierName && payload.cashier && <span>الكاشير: {payload.cashier.name}</span>}
        {settings.showCustomerInfo && payload.customer && <span>العميل: {payload.customer.name} - {payload.customer.phone}</span>}
      </section>

      <table className="receipt-table">
        <thead>
          <tr>
            <th>الصنف</th>
            <th>كمية</th>
            <th>السعر</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {payload.items.map((item) => (
            <tr key={item.id}>
              <td>{item.productName}</td>
              <td>{formatQty(item.quantity)}</td>
              <td>{formatMoney(item.unitPrice)}</td>
              <td>{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="receipt-totals">
        <Row label="المجموع" value={formatMoney(payload.totals.subtotal)} />
        <Row label="الخصم" value={formatMoney(payload.totals.discountTotal)} />
        <Row label="الضريبة" value={formatMoney(payload.totals.taxTotal)} />
        <Row label="الإجمالي" value={formatMoney(payload.totals.total)} strong />
        <Row label="المدفوع" value={formatMoney(payload.totals.paidAmount)} />
        <Row label="الباقي" value={formatMoney(payload.totals.changeAmount)} />
      </section>

      <section className="receipt-payments">
        <p className="receipt-section-title">تفاصيل الدفع</p>
        {payload.payments.map((payment) => (
          <Row key={payment.id} label={paymentLabels[payment.method]} value={formatMoney(payment.amount)} />
        ))}
      </section>

      {payload.invoice.notes && <p className="receipt-status">ملاحظات: {payload.invoice.notes}</p>}
      {payload.returnStatus && <p className="receipt-status">حالة المرتجع: {payload.returnStatus}</p>}
      {settings.receiptFooter && <footer className="receipt-footer">{settings.receiptFooter}</footer>}
    </article>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "receipt-row receipt-row-strong" : "receipt-row"}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatQty(value: number) {
  return Number.isInteger(value) ? value.toLocaleString("ar-EG") : value.toLocaleString("ar-EG", { maximumFractionDigits: 3 });
}

function formatDateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
