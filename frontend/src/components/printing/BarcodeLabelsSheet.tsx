import type { BarcodeLabelPayload } from "../../types";
import { BarcodeLabel } from "./BarcodeLabel";

type BarcodeLabelsSheetProps = {
  payload: BarcodeLabelPayload;
};

export function BarcodeLabelsSheet({ payload }: BarcodeLabelsSheetProps) {
  const labels = payload.products.flatMap((product) =>
    Array.from({ length: product.copies }, (_, index) => ({ ...product, key: `${product.id}-${index}` })),
  );
  const margins = {
    paddingTop: payload.settings.marginTop ?? undefined,
    paddingRight: payload.settings.marginRight ?? undefined,
    paddingBottom: payload.settings.marginBottom ?? undefined,
    paddingLeft: payload.settings.marginLeft ?? undefined,
  };

  return (
    <div className="print-area barcode-sheet" style={margins}>
      <div className="barcode-label-grid" style={{ gridTemplateColumns: `repeat(${payload.settings.columns}, minmax(0, 1fr))` }}>
        {labels.map((product) => (
          <BarcodeLabel key={product.key} product={product} settings={payload.settings} />
        ))}
      </div>
    </div>
  );
}
