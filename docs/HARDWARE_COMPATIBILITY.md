# Hardware Compatibility

Raseed starts with Windows-compatible hardware profiles. Do not buy a printer or scanner based only on price before the supplier confirms the exact model, driver source, and Windows version.

## Barcode scanner

Buy a wired USB scanner that works as **Keyboard HID**. It should scan EAN-13 and Code 128 and be configurable to send Enter after each scan. This normally needs no custom driver and is the best first-shop choice.

Test before accepting delivery:

1. Scan 100 codes in a row into a text editor.
2. Confirm every scan includes the expected digits once only.
3. Confirm the scanner sends Enter after the code.
4. Test Arabic/English keyboard layout does not change digits.

## Receipt printer

For a clothing shop, buy a Windows-supported thermal receipt printer with a local Windows driver. Choose 80mm unless the shop already uses 58mm receipts. Ask the vendor to confirm:

- Exact model number and Windows 10/11 x64 driver link.
- USB connection at minimum; Ethernet is useful for a fixed counter.
- ESC/POS compatibility, auto-cut support, and cash-drawer port if needed.
- A physical Arabic/English self-test print.

Raseed can use the Windows print dialog with any supported printer. Silent printing, cutter behavior, and cash-drawer opening are enabled only after testing the exact model as an approved device profile.

## Label printer

This is separate from the receipt printer. For clothing barcode labels, confirm the label size, DPI, Windows driver, and roll availability before purchase. Do not assume a receipt printer can print stock labels.
