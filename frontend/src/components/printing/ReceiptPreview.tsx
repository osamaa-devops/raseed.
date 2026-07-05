import type { ReceiptPayload } from "../../types";
import { PrintableReceipt } from "./PrintableReceipt";

export function ReceiptPreview({ payload }: { payload: ReceiptPayload }) {
  return (
    <div className="receipt-preview-shell">
      <PrintableReceipt payload={payload} />
    </div>
  );
}
