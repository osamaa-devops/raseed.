import { useEffect, useId, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import type { BarcodeLabelProduct, BarcodeLabelSettings } from "../../types";

type BarcodeLabelProps = {
  product: BarcodeLabelProduct;
  settings: BarcodeLabelSettings;
};

const CODE128_SAFE_VALUE = /^[0-9A-Za-z\-_.:/$+%]+$/;

export function BarcodeLabel({ product, settings }: BarcodeLabelProps) {
  const barcodeValue = normalizeBarcodeValue(product.barcode);
  const barcodeId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const validationError = useMemo(() => validateBarcodeValue(barcodeValue), [barcodeValue]);

  useEffect(() => {
    setRenderError(null);
  }, [barcodeValue]);

  useEffect(() => {
    if (!svgRef.current || validationError) {
      return;
    }

    try {
      setRenderError(null);
      svgRef.current.replaceChildren();
      JsBarcode(svgRef.current, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        background: "#ffffff",
        lineColor: "#111111",
        margin: 0,
        width: 2,
        height: 56,
        textMargin: 0,
      });
    } catch {
      setRenderError("تعذر إنشاء الباركود للطباعة.");
      svgRef.current.replaceChildren();
      svgRef.current.removeAttribute("aria-label");
    }
  }, [barcodeValue, validationError]);

  return (
    <div className={`barcode-label barcode-label-${settings.labelSize.toLowerCase()}`} aria-live="polite">
      {settings.showProductName && <div className="barcode-label-name">{product.name}</div>}

      {validationError || renderError ? (
        <div className="barcode-label-error" data-testid="barcode-error">
          {validationError || renderError}
        </div>
      ) : (
        <div className="barcode-label-graphic">
          <svg
            ref={svgRef}
            id={barcodeId}
            className="barcode-label-svg"
            data-testid="barcode-svg"
            role="img"
            aria-label={`باركود المنتج ${product.name}`}
            focusable="false"
          />
        </div>
      )}

      {settings.showBarcodeText && <div className="barcode-label-code" dir="ltr">{barcodeValue}</div>}
      {settings.showPrice && <div className="barcode-label-price">{formatMoney(product.sellingPrice)}</div>}
    </div>
  );
}

function normalizeBarcodeValue(value: string) {
  return value.trim();
}

function validateBarcodeValue(value: string) {
  if (!value) {
    return "لا يمكن طباعة ملصق بدون باركود.";
  }

  if (!CODE128_SAFE_VALUE.test(value)) {
    return "الباركود غير صالح للطباعة. استخدم حروفًا وأرقامًا ورموزًا أساسية فقط.";
  }

  return null;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}
