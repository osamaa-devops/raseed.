import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BarcodeLabel } from "./BarcodeLabel";
import type { BarcodeLabelProduct, BarcodeLabelSettings } from "../../types";

const settings: BarcodeLabelSettings = {
  id: "settings-1",
  storeId: "store-1",
  labelSize: "MEDIUM",
  showProductName: true,
  showPrice: true,
  showBarcodeText: true,
  columns: 2,
  rows: null,
  marginTop: null,
  marginRight: null,
  marginBottom: null,
  marginLeft: null,
  createdAt: "2026-07-06T00:00:00.000Z",
  updatedAt: "2026-07-06T00:00:00.000Z",
};

const product: BarcodeLabelProduct = {
  id: "product-1",
  name: "حليب المدينة 1 لتر",
  barcode: "1234567890123",
  sellingPrice: 18.5,
  copies: 1,
};

describe("BarcodeLabel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a scannable SVG barcode and label fields for valid values", async () => {
    const { container } = render(<BarcodeLabel product={product} settings={settings} />);

    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText("1234567890123")).toBeInTheDocument();
    expect(screen.getByText("١٨٫٥ ج")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector("svg.barcode-label-svg")).toBeInTheDocument();
      expect(container.querySelector("svg.barcode-label-svg")?.children.length).toBeGreaterThan(0);
    });
  });

  it("hides optional fields when settings disable them", async () => {
    const { container } = render(
      <BarcodeLabel
        product={product}
        settings={{
          ...settings,
          showProductName: false,
          showPrice: false,
          showBarcodeText: false,
        }}
      />,
    );

    expect(screen.queryByText(product.name)).not.toBeInTheDocument();
    expect(screen.queryByText("1234567890123")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector("svg.barcode-label-svg")).toBeInTheDocument();
    });
  });

  it("shows a clear Arabic error for missing or invalid barcode values", () => {
    render(<BarcodeLabel product={{ ...product, barcode: "" }} settings={settings} />);

    expect(screen.getByTestId("barcode-error")).toHaveTextContent("لا يمكن طباعة ملصق بدون باركود.");
    expect(document.querySelector("svg.barcode-label-svg")).not.toBeInTheDocument();
  });
});
