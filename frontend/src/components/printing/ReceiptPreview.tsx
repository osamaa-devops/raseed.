import type { ReceiptPayload } from "../../types";
import { PrintableReceipt } from "./PrintableReceipt";

export function ReceiptPreview({ payload }: { payload: ReceiptPayload }) {
  return (
    <div className="receipt-preview-shell">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>معاينة الإيصال قبل الطباعة</span>
        <span>{payload.receiptSettings.paperSize.replace("_", " ")}</span>
      </div>
      <PrintableReceipt payload={payload} />
    </div>
  );
}
