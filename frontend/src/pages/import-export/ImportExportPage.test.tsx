import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewBlock } from "./ImportExportPage";

describe("PreviewBlock", () => {
  it("renders import counts and row-level errors", () => {
    render(
      <PreviewBlock
        preview={{
          totalRows: 2,
          validRows: 1,
          invalidRows: 1,
          createCount: 1,
          updateCount: 0,
          warnings: [],
          errors: [{ row: 3, field: "sellingPrice", message: "Selling price is required." }],
          sampleRows: [],
        }}
      />,
    );

    expect(screen.getByText("الإجمالي: 2")).toBeInTheDocument();
    expect(screen.getByText("أخطاء: 1")).toBeInTheDocument();
    expect(screen.getByText("sellingPrice")).toBeInTheDocument();
    expect(screen.getByText("Selling price is required.")).toBeInTheDocument();
  });
});
