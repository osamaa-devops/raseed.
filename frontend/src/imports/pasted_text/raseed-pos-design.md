Create a complete Arabic RTL SaaS product design for a real supermarket and retail POS system called “Raseed — رصيد”.

Product tagline:
“رصيد — مبيعاتك، مخزونك، وأرباحك في مكان واحد.”

Project goal:
Design a professional, sellable SaaS web application for supermarkets, mini markets, grocery stores, mobile shops, electronics shops, cosmetics shops, pharmacies, electronics stores, and general retail stores.

The system must look like a real product ready to be converted later into a full-stack application using:

* React
* NestJS + TypeScript
* PostgreSQL + Prisma
* Electron desktop wrapper later

Important:
This is not a student project or fake dashboard. Design it like a real SaaS product that can be sold to real store owners.

Design direction:

* Arabic RTL interface.
* Clean modern SaaS dashboard.
* Desktop-first design for cashier/POS usage.
* Responsive owner dashboard for mobile and tablet.
* Professional enough to sell to supermarket and retail store owners.
* Very simple cashier experience.
* Powerful owner/admin experience.
* Avoid childish colors or fake-looking layouts.
* Use realistic Arabic data.
* Use clear tables, cards, charts, modals, filters, forms, empty states, loading states, and error states.
* The design must be ready for backend integration, not just a landing page demo.
* Make the system flexible for supermarkets and general retail stores, not only grocery-specific stores.

Brand:
Name: Raseed
Arabic name: رصيد
Brand feeling:
Trustworthy, smart, simple, modern, retail-focused, practical, and professional.

Suggested visual direction:

* Modern logo wordmark for “Raseed / رصيد”.
* Use colors that feel professional, trustworthy, and suitable for finance + retail + technology.
* Use clean icons for sales, inventory, products, reports, users, settings, subscriptions, and hardware.

Main users:

1. Super Admin:
   The SaaS owner who manages all subscribed stores.

2. Store Owner:
   The store owner who sees sales, profit, stock, reports, users, subscriptions, and settings.

3. Manager:
   Manages products, inventory, suppliers, customers, employees, and reports.

4. Cashier:
   Uses only the POS screen to sell products quickly.

5. Inventory Employee:
   Manages stock movements, damaged items, expiry alerts, and manual stock adjustments.

General layout requirements:

* Use a clean RTL sidebar.
* Use a top bar with store name, branch selector, online/offline status, notifications, and user menu.
* Add branch selector in the top bar for stores with multiple branches.
* Show current branch in POS, reports, inventory, invoices, sales, and dashboard.
* Include an online/offline status indicator in the interface, especially in the POS layout, as a future-ready placeholder.
* Use professional spacing, typography, tables, cards, charts, and empty states.
* Make pages feel connected as one real product.

Required app structure:

A) Public Website / Landing Page

Create a professional Arabic landing page for selling Raseed to store owners.

Sections:

* Hero section with clear headline:
  “نظام كاشير ومخزون ذكي للسوبر ماركت والمحلات”
* Subtitle:
  “تابع مبيعاتك، مخزونك، أرباحك، وموظفينك من مكان واحد.”
* CTA buttons:
  “اطلب تجربة مجانية”
  “شاهد العرض التوضيحي”
* Benefits section:

  * بيع أسرع بالباركود
  * متابعة المخزون لحظة بلحظة
  * تقارير أرباح واضحة
  * صلاحيات للموظفين
  * فواتير وطباعة
  * متابعة من الموبايل
  * مناسب لأكثر من نوع محل
* Hardware support section:
  Barcode Scanner, Receipt Printer, Cash Drawer, Barcode Printer, Touch Screen, Scale.
* Pricing section:
  Basic, Pro, Business, Enterprise.
* Demo section.
* FAQ section.
* Contact / request demo form.

B) Authentication Pages

1. Login page:

* Phone/email + password.
* Role-aware login.
* Forgot password.
* Clean Arabic UI.
* Store code or store selection if needed.

2. Store registration / request demo page:

* Store name.
* Owner name.
* Phone number.
* Store type.
* Number of branches.
* Number of cashiers.
* City.
* Preferred contact time.

C) First-Time Onboarding Wizard

Create a first-time setup wizard for new stores.

Steps:

1. Store information:

* Store name
* Logo
* Address
* Phone
* Store type

2. Branch setup:

* Main branch name
* Branch address
* Branch phone

3. Tax and payment setup:

* Enable/disable tax
* Tax percentage
* Payment methods:
  Cash, Card, Wallet, Mixed

4. Hardware setup:

* Receipt printer
* Barcode scanner
* Cash drawer
* Barcode printer
* Scale placeholder

5. First cashier:

* Cashier name
* Phone/email
* Password
* Role

6. First products:

* Add manually
* Import from Excel
* Skip for later

Use friendly guidance and progress steps.

D) Owner Dashboard

Design a main dashboard for the store owner.

Widgets:

* مبيعات اليوم
* صافي الربح
* عدد الفواتير
* متوسط قيمة الفاتورة
* المنتجات قليلة المخزون
* منتجات قربت تنتهي صلاحيتها
* أفضل المنتجات مبيعًا
* آخر العمليات
* أداء الكاشيرين
* Sales chart daily/weekly/monthly
* Profit chart
* Inventory value card
* Expenses today
* Returns today
* Current branch selector
* Online/offline indicator

Add quick action buttons:

* بيع جديد
* إضافة منتج
* إضافة مصروف
* عرض الفواتير
* طباعة تقرير اليوم
* إضافة موظف

Make it clear and easy for a store owner to understand in 30 seconds.

E) POS Cashier Screen

This is the most important screen.

Design a fast, practical POS page, different from normal dashboard pages.

Requirements:

* Large barcode/product search input at the top.
* Product search by barcode or name.
* Quick product cards/list.
* Cart table.
* Quantity controls.
* Remove item.
* Item discount.
* Total, subtotal, discount, tax optional, final total.
* Payment methods:
  Cash, Card, Wallet, Mixed.
* Amount paid.
* Change amount.
* Buttons:
  “إتمام البيع”
  “طباعة الفاتورة”
  “تعليق الطلب”
  “إلغاء”
  “استرجاع”
* Current cashier name.
* Current shift.
* Current branch.
* Invoice number.
* Online/offline status.
* Very large buttons suitable for touch screen.
* Keyboard/barcode scanner friendly layout.
* Receipt preview modal after sale.
* Clear refund and return flow from the POS screen.
* Return reason modal.
* Held orders panel.
* Recent invoices quick access.

The POS screen must be extremely fast, clear, and practical.

F) Shift Management

Create cashier shift management screens.

Screens:

1. Open shift:

* Cashier name
* Branch
* Opening cash amount
* Start time
* Notes

2. Active shift:

* Current sales
* Cash payments
* Card payments
* Wallet payments
* Returns
* Expenses during shift
* Expected cash

3. Close shift:

* Closing cash amount
* Expected cash
* Actual cash
* Difference
* Shift summary
* Notes
* Manager approval placeholder

4. Shift history:

* Cashier
* Branch
* Start time
* End time
* Total sales
* Difference
* Status

G) End-of-Day Closing Summary

Create an end-of-day closing screen for the owner/manager.

Show:

* Total sales
* Total returns
* Total expenses
* Net cash
* Card payments
* Wallet payments
* Cash drawer expected amount
* Actual cash
* Difference
* Best selling products
* Low stock products
* Cashier summaries
* Print daily closing report button
* Export PDF/Excel buttons

H) Products Management

Create product management pages.

Required:

* Products table.
* Search and filters.
* Add product modal/page.
* Edit product.
* Delete confirmation.
* Product details page.
* Product fields:

  * Product name
  * Barcode
  * Category
  * Purchase price
  * Selling price
  * Profit margin
  * Stock quantity
  * Minimum stock
  * Supplier
  * Expiry date
  * Product image
  * Unit type
  * Branch availability
* Import from Excel button.
* Export button.
* Generate barcode button.
* Print barcode button.
* Low stock indicator.
* Expiry indicator.
* Active/inactive product status.

I) Categories

* Categories table/cards.
* Add/edit/delete category.
* Category name.
* Number of products.
* Active/inactive status.
* Category icon/color.

J) Inventory

Create a full inventory management section.

Pages/cards:

* Current stock.
* Low stock alerts.
* Expiry alerts.
* Stock movement history.
* Add stock.
* Remove damaged/expired stock.
* Manual adjustment.
* Transfer stock placeholder for future multi-branch.
* Movement type:
  Sale, Purchase, Return, Damage, Manual adjustment, Transfer.
* Show who performed each movement and when.
* Show branch.
* Show before quantity and after quantity.
* Add filters by product, branch, movement type, and date.

K) Sales & Invoices

* Invoices table.
* Invoice details page.
* Filter by date.
* Filter by cashier.
* Filter by payment method.
* Filter by branch.
* Print invoice.
* Refund invoice.
* Partial refund.
* Return reason modal.
* Invoice status:
  Paid, Refunded, Partially refunded.
* Show payment breakdown.
* Show cashier and shift.
* Show customer if attached.

L) Returns & Refunds

Design a clear return/refund flow.

Required:

* Search invoice by invoice number or customer.
* Select items to return.
* Choose quantity.
* Return reason.
* Refund method.
* Refund summary.
* Manager approval placeholder.
* Returned items update stock.
* Return receipt preview.
* Return history table.

M) Expenses

* Expenses dashboard.
* Add expense.
* Categories:
  Rent, Salaries, Electricity, Maintenance, Delivery, Other.
* Daily/monthly expense reports.
* Expense table with filters.
* Attach receipt image placeholder.
* Branch field.
* Employee who added expense.

N) Reports

Design a strong reports section.

Reports:

* Daily sales report.
* Monthly sales report.
* Profit report.
* Inventory value report.
* Best-selling products.
* Worst-selling products.
* Cashier performance.
* Shift reports.
* Expenses report.
* Payment methods report.
* Returns report.
* Branch performance placeholder.
* Export PDF/Excel buttons.
* Print report button.

O) Users & Permissions

* Users table.
* Add employee.
* Roles:
  Owner, Manager, Cashier, Inventory Employee.
* Permissions matrix.
* Active/inactive user.
* Last login.
* Reset password.
* Assigned branch.
* Activity log link per user.

P) Activity Logs

* Show important actions:

  * Product added
  * Product edited
  * Invoice refunded
  * Stock adjusted
  * User created
  * Discount applied
  * Shift opened
  * Shift closed
  * Expense added
  * Settings changed
* Fields:
  User, action, date/time, branch, details.
* Filters by user/action/date/branch.
* Details drawer/modal.

Q) Suppliers

* Suppliers table.
* Supplier profile.
* Phone, address, balance.
* Supplied products.
* Payment history.
* Purchase orders.
* Supplier debt.
* Add supplier payment.
* Active/inactive status.

R) Purchase Orders

Add a purchase orders page/module.

Required:

* Purchase orders table.
* Create purchase order.
* Supplier selection.
* Product list.
* Quantity.
* Expected delivery date.
* Status:
  Draft, Sent, Partially received, Received, Cancelled.
* Receive stock from purchase order.
* Purchase order details page.
* Print/export purchase order.

S) Customers & Debts

* Customers table.
* Customer profile.
* Phone.
* Purchase history.
* Debt balance.
* Partial payments.
* Loyalty points placeholder.
* Due date.
* Debt payment modal.
* Customer status.
* Debt alerts.
* Customer invoice history.

T) Notifications Center

* Low stock notifications.
* Expiry notifications.
* Subscription notifications.
* Unusual sales drop notification.
* Unpaid debts notification.
* Shift closing alert.
* Backup alert.
* Mark as read/unread.
* Notification filters.

U) AI Insights

Design this as a future smart insights page, not a fake chatbot.

Cards:

* “المنتج ده قرب يخلص”
* “المبيعات أقل من الأسبوع اللي فات”
* “منتج بقاله فترة مش بيتباع”
* “الربح اليومي أقل من المتوقع”
* “اقترح طلب شراء للمورد”
* “منتجات محتاجة عرض أو خصم”
* “كاشير مبيعاته أقل من المعتاد”
* “مصاريف الشهر أعلى من الطبيعي”

Make it look useful, practical, and simple.

V) Settings

Settings pages:

* Store information.
* Branches management placeholder.
* Receipt design.
* Tax settings.
* Payment methods.
* Hardware settings:
  Printer, Barcode Scanner, Cash Drawer, Scale.
* Backup settings.
* Theme settings:
  Light/Dark mode.
* Language:
  Arabic default.
* Subscription plan info.
* Security settings.
* Data import/export settings.

W) Store Owner Subscription & Billing Page

Create a subscription and billing page for store owners.

Show:

* Current plan.
* Renewal date.
* Subscription status.
* Usage limits:
  Users, products, branches, invoices.
* Upgrade plan button.
* Billing history.
* Payment method placeholder.
* Plan features comparison.
* Contact support for enterprise.

X) Help & Support Section

Add a help/support area inside the system.

Required:

* FAQ.
* Quick start guide.
* How to add product.
* How to sell from POS.
* How to print invoice.
* How to close shift.
* Contact support button.
* Support tickets placeholder.
* Short video guide placeholders.

Y) SaaS Super Admin Panel

This is for Raseed platform owner.

Required pages:

* Platform dashboard.
* Total subscribed stores.
* Active stores.
* Expired subscriptions.
* Monthly recurring revenue.
* Stores table.
* Store details.
* Create store account.
* Enable/disable store.
* Plans management.
* Subscription status.
* Payment history.
* Support tickets.
* Usage overview:
  Number of users, products, invoices, branches.
* Store activity overview.
* Failed payments placeholder.
* Trial stores.
* Expiring soon subscriptions.

Z) Demo Data

Use realistic Arabic demo data.

Store:

* ماركت المدينة

Branches:

* الفرع الرئيسي
* فرع الحي الأول

Products:

* لبن جهينة
* سكر أبيض
* أرز مصري
* زيت خليط
* شاي العروسة
* مياه معدنية
* جبنة بيضاء
* مكرونة
* بسكويت
* مسحوق غسيل
* عصير مانجو
* بيبسي
* زبادي
* تونة
* صابون

Categories:

* ألبان
* بقالة
* مشروبات
* منظفات
* مجمدات
* معلبات

Cashiers:

* أحمد
* محمود

Suppliers:

* شركة النور للتوريدات
* مورد المدينة
* شركة الأمل للمواد الغذائية

Customers:

* محمد علي
* أحمد حسن
* مصطفى السيد

AA) Design System

Create a design system including:

* Colors
* Typography
* Buttons
* Inputs
* Cards
* Tables
* Badges
* Modals
* Alerts
* Charts
* Sidebar
* Navbar
* Empty states
* Loading skeletons
* Error states
* Form validation states
* Status badges
* Toast notifications
* Confirmation dialogs

AB) Navigation

Use a clean RTL sidebar with:

For store users:

* الرئيسية
* الكاشير
* الشيفتات
* إغلاق اليوم
* المنتجات
* التصنيفات
* المخزون
* المبيعات والفواتير
* المرتجعات
* المصاريف
* التقارير
* الموردين
* أوامر الشراء
* العملاء والديون
* التنبيهات
* الذكاء والتحليلات
* المستخدمين والصلاحيات
* سجل النشاط
* الاشتراك والفواتير
* المساعدة والدعم
* الإعدادات

For Super Admin:

* لوحة المنصة
* المحلات
* الاشتراكات
* الباقات
* المدفوعات
* الدعم الفني
* الإعدادات

AC) Important UX Rules

* POS screen must be extremely fast and clear.
* Do not hide important POS actions.
* Store owner dashboard must be understandable quickly.
* Tables must support search, filters, actions, and status badges.
* Forms must be clean and not overwhelming.
* Use modals for quick add/edit where suitable.
* Use full pages for complex forms.
* Make the product feel ready to sell to real store owners.
* Do not make it look like a student project.
* Add friendly first-use empty states with guidance for new stores that have no products, no sales, or no reports yet.
* Add realistic loading and error states.
* Add confirmation dialogs before dangerous actions.
* Make the product scalable for future desktop app, offline mode, multi-branch, AI insights, and subscription billing.

Final output:
Generate the complete Figma Make design/prototype for Raseed with all main screens, responsive layouts, Arabic RTL UI, realistic data, polished SaaS product feel, full design system, POS-focused UX, onboarding wizard, shift management, end-of-day closing, subscription billing, support section, and SaaS super admin panel.
