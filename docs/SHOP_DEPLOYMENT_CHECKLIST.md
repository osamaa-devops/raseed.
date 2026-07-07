# Shop Deployment Checklist

This checklist is for the intended `dev`-branch commercial shape of Raseed:

- one physical shop
- one local PostgreSQL database on the shop machine
- one or more shop PCs
- local printer and barcode scanner
- cashier accounts with limited permissions
- owner accounts with wider permissions
- no Docker in day-to-day use

## 1. Prepare the machine

- Install Windows on the shop PC.
- Install PostgreSQL locally.
- Install Node.js only if you plan to run the app from source during testing.
- Connect the receipt printer.
- Connect the barcode scanner.
- Confirm the scanner types barcodes as keyboard input.

## 2. Install the app

- Build the desktop installer from `dev`.
- Copy the installer to the USB flash drive if needed.
- Run the installer on the target machine.
- Confirm the app opens from one desktop icon.
- Confirm the Start Menu shortcut exists.

## 3. Prepare local PostgreSQL

Use the local shop database:

- database: `raseed_dev`
- user: `raseed`
- password: `raseed_password`

The app is designed to point at a local PostgreSQL instance like:

```env
DATABASE_URL=postgresql://raseed:raseed_password@localhost:5432/raseed_dev?schema=public
```

## 4. First launch

- Start PostgreSQL.
- Open the app.
- Let the backend bootstrap run.
- Activate the license if the packaged app asks for it.
- Complete the first-run setup wizard.
- Create the shop profile.
- Create the owner account.
- Log in with the owner account.

## 5. Create shop users

Recommended local setup for a small shop:

- 2 owner accounts
- 2 cashier accounts
- 1 inventory/stock account

Suggested permissions:

- Cashier: POS only, open/close own shift, print receipt, no settings or reports
- Inventory staff: products and stock only, no selling, no revenue/profit access
- Owner: full access
- Manager: reports/products/sales/stock, but not license or owner account control

## 6. POS hardware flow

- Keep the barcode field focused by default.
- Verify the scanner enters items into the barcode field.
- Print one receipt and confirm the printer works.
- Open a shift before selling.
- Sell a product.
- Confirm stock decreases.
- Perform a return.
- Confirm stock increases back.

## 7. Backup and restore

- Set the backup folder from inside the app.
- Create a manual backup.
- Confirm the file is encrypted.
- Restore the backup on a test copy first.
- Only Owner should be allowed to restore.
- Confirm backup and restore events appear in the audit log.

## 8. Anti-piracy and licensing

The practical commercial goal is:

- bind the license to one machine fingerprint
- store the license locally in encrypted form
- ask for activation again if the app is copied to another PC
- allow development mode to stay unblocked

Important limitation:

- offline desktop software cannot be made impossible to copy
- the realistic protection is machine-bound activation plus operational friction

## 9. What to verify before handing to a shop

- Login works.
- Cashier can sell.
- Owner can manage the store.
- The printer prints a receipt.
- The scanner adds items quickly.
- The database remains on the local machine.
- Backup and restore work.
- The license remains tied to the machine.

## 10. Current status

Raseed is already close to this deployment shape, but the remaining work is mainly:

- real Windows machine verification
- final installer verification
- final backup/restore drill on Windows
- final security and CSRF documentation
- a few polish items like PDF exports and product images
