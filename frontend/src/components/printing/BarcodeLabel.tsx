import type { BarcodeLabelProduct, BarcodeLabelSettings } from "../../types";

type BarcodeLabelProps = {
  product: BarcodeLabelProduct;
  settings: BarcodeLabelSettings;
};

export function BarcodeLabel({ product, settings }: BarcodeLabelProps) {
  return (
    <div className={`barcode-label barcode-label-${settings.labelSize.toLowerCase()}`}>
      {settings.showProductName && <div className="barcode-label-name">{product.name}</div>}
      <BarcodeBars value={product.barcode} />
      {settings.showBarcodeText && <div className="barcode-label-code">{product.barcode}</div>}
      {settings.showPrice && <div className="barcode-label-price">{formatMoney(product.sellingPrice)}</div>}
    </div>
  );
}

export function BarcodeBars({ value }: { value: string }) {
  const digits = value.replace(/\D/g, "") || value;
  const bars = Array.from(digits).flatMap((char, index) => {
    const digit = Number(char) || 0;
    return [
      { width: 1 + (digit % 3), height: 58 + ((digit + index) % 4) * 8 },
      { width: 1, height: 50 + ((digit * 2 + index) % 5) * 7 },
    ];
  });

  return (
    <div className="barcode-bars" aria-label={value}>
      {bars.map((bar, index) => (
        <span key={index} style={{ width: `${bar.width}px`, height: `${bar.height}%` }} />
      ))}
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}
