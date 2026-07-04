# خطة تحسينات رصيد — Raseed Improvement Plan

## ما اتعمل فعلاً
- زرار تسجيل الخروج اتصلح — بيرجع لصفحة login مع hover أحمر

---

## التحسينات المقترحة (مرتبة حسب الأولوية)

---

### 1. Toast Notifications — تنبيهات الإجراءات ⭐ أولوية عالية

**المشكلة:** لما المستخدم يضيف منتج، يكمل بيع، يحفظ إعدادات، أو يحذف عنصر — مفيش أي confirmation بصري. المستخدم مش عارف اتعمل حاجة ولا لأ.

**الحل:** إضافة toast system بسيط باستخدام `sonner` (موجودة في الـ dependencies):
- بيع ناجح → toast أخضر "تم البيع بنجاح — 187 ج"
- إضافة منتج → toast أخضر "تم إضافة المنتج"
- حذف → toast أحمر مع زرار Undo
- حفظ إعدادات → toast "تم الحفظ"
- خطأ → toast أحمر

**الملفات:** App.tsx — إضافة `<Toaster />` في root + استدعاء `toast()` في كل action

---

### 2. Confirmation Dialogs — تأكيد العمليات الخطيرة ⭐ أولوية عالية

**المشكلة:** زرار الحذف (منتج، موظف، مصروف) بيحذف مباشرة بدون تأكيد — خطر جداً.

**الحل:** modal تأكيد قبل أي عملية حذف أو إلغاء فاتورة:
- "هل أنت متأكد من حذف [اسم المنتج]؟"
- زرار "إلغاء" وزرار "حذف" أحمر
- نفس الشيء لاسترجاع الفواتير

**الملفات:** App.tsx — إضافة `ConfirmDialog` component

---

### 3. Sidebar Collapse on Mobile ⭐ أولوية عالية

**المشكلة:** على الشاشات الصغيرة (موبايل/تابلت) الـ sidebar بيظل فاتح وبياخد مساحة كبيرة، والـ content بيتضغط.

**الحل:**
- على شاشات أقل من 768px: الـ sidebar يتخبى تلقائياً
- زرار hamburger menu في الـ topbar يفتح/يقفل الـ sidebar كـ overlay
- dashboard cards تتحول لعمود واحد على الموبايل

**الملفات:** App.tsx — إضافة `useEffect` يتحكم في `collapsed` بناءً على window width + overlay mode

---

### 4. POS — Keyboard Shortcuts ⭐ أولوية متوسطة

**المشكلة:** الكاشير محتاج يشتغل بسرعة، والـ POS المحترف لازم يدعم keyboard shortcuts.

**الحل:**
- `F2` → focus على search input
- `Enter` → إضافة أول منتج في نتيجة البحث للسلة
- `F12` أو `Ctrl+Enter` → إتمام البيع
- `Escape` → مسح البحث
- `+` / `-` → تعديل الكمية على العنصر المحدد

**الملفات:** POSScreen component — إضافة `useEffect` مع `keydown` event listener

---

### 5. Search في كل الجداول ⭐ أولوية متوسطة

**المشكلة:** جداول الموردين، العملاء، سجل النشاط، الشيفتات مفيش فيها بحث — لازم التمرير للإيجاد.

**الحل:** إضافة search input فوق كل جدول، بحث real-time على الـ data المعروضة.

**الملفات:** SuppliersPage, CustomersPage, ActivityLogPage, ShiftsPage

---

### 6. Dark Mode ⭐ أولوية متوسطة

**المشكلة:** الإعدادات فيها "وضع مظلم" كـ placeholder لكنه مش شغال.

**الحل:**
- زرار toggle في الـ topbar أو صفحة الإعدادات
- يضيف class `dark` على الـ `html` element
- الـ theme.css فيها `.dark` block جاهزة بالفعل

**الملفات:** App.tsx — إضافة state + localStorage persistence

---

### 7. Invoice Number Generator ⭐ أولوية منخفضة

**المشكلة:** رقم الفاتورة في الـ POS ثابت "INV-2024-0896" — مش بيتغير بعد كل بيع.

**الحل:** counter بسيط في الـ state يزيد مع كل عملية بيع ناجحة.

**الملفات:** POSScreen — إضافة `invoiceCounter` state

---

### 8. Print Invoice (Browser Print) ⭐ أولوية منخفضة

**المشكلة:** زرار "طباعة" موجود في كل مكان لكن مش شغال.

**الحل:** استخدام `window.print()` مع CSS `@media print` يخفي الـ sidebar والـ topbar ويطبع الفاتورة بس.

**الملفات:** App.tsx — إضافة print stylesheet + `window.print()` على زرار الطباعة

---

### 9. Form Validation ⭐ أولوية منخفضة

**المشكلة:** Forms الإضافة (منتج، موظف، مصروف) مفيش فيها validation — ممكن تتبعت فارغة.

**الحل:** basic validation قبل الـ submit:
- حقول required تتلون بالأحمر لو فارغة
- رسالة error تحت الحقل
- الزرار يتعطل لو الـ form مش valid

**الملفات:** Modal forms في ProductsPage, ExpensesPage, UsersPage

---

## ترتيب التنفيذ المقترح

| الأولوية | التحسين | الوقت المقدر |
|----------|---------|--------------|
| 1 | Toast Notifications (sonner) | سريع |
| 2 | Confirmation Dialogs | سريع |
| 3 | Mobile Sidebar Overlay | متوسط |
| 4 | Dark Mode Toggle | متوسط |
| 5 | Table Search | سريع |
| 6 | POS Keyboard Shortcuts | متوسط |
| 7 | Form Validation | متوسط |
| 8 | Invoice Counter | سريع |
| 9 | Print Support | متوسط |
