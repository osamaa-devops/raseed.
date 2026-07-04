# خطة الجاهزية للاستخدام الفعلي — Raseed Production Readiness

## ما اتعمل لحد دلوقتي ✅
- كل الصفحات الـ 25+ (Landing, Auth, Dashboard, POS, Products, Inventory, Sales, Reports, ...)
- RBAC كامل — كل دور يشوف اللي بيخصه بس
- Toast notifications بعد كل إجراء
- Confirm dialogs قبل الحذف
- Dark mode / Light mode مع persistence
- Mobile sidebar responsive
- POS keyboard shortcuts (F2, F12, Esc)
- Dynamic invoice counter
- Search في الجداول

---

## اللي ناقص للاستخدام الفعلي

### 🔴 أولوية عالية جدًا (لازم قبل أي عميل)

#### 1. POS — إضافة عميل للفاتورة
- حاليًا الفاتورة "بدون عميل" دايمًا
- محتاج: search box للعملاء في شاشة POS
- لما تختار عميل: اسمه يظهر على الفاتورة والإيصال
- لو عنده دين: يظهر alert تحت اسمه

#### 2. POS — خصم على الفاتورة الكلية
- حاليًا في خصم على كل item بس لكن مش بيتحسب
- محتاج: حقل "خصم على الفاتورة" (نسبة % أو مبلغ ثابت)
- يأثر على الإجمالي في real-time

#### 3. إضافة عميل من POS مباشرة
- زرار "عميل جديد" في شاشة الكاشير يفتح mini modal
- اسم + هاتف بس، مش form كامل

#### 4. POS — طريقة دفع مختلطة (Mixed Payment)
- حاليًا كاش أو كارت أو محفظة — مش المختلط
- محتاج: تحديد مبلغ كاش + مبلغ كارت في نفس الوقت

#### 5. Stock validation في POS
- لو المنتج مخزونه 0: يظهر disabled مع badge "نفد"
- لو الكمية في السلة أكبر من المخزون: warning قبل إتمام البيع

#### 6. Barcode generation للمنتجات
- زرار "توليد باركود" في صفحة إضافة منتج
- يولد EAN-13 تلقائي لو المنتج مالوش باركود

---

### 🟡 أولوية متوسطة (مهمة للعمل اليومي)

#### 7. Shift — ربط POS بالشيفت
- حاليًا ممكن تبيع من غير ما تفتح شيفت
- لازم: لو مفيش شيفت مفتوح، الـ POS يطلب فتح شيفت الأول

#### 8. Shift — حساب الكاش المتوقع صح
- حاليًا الأرقام ثابتة (hardcoded)
- لازم: تجمع الـ cash sales من أول ما فتح الشيفت

#### 9. Products — Edit Modal
- زرار Edit موجود لكن مش بيفتح حاجة
- محتاج نفس الـ Add modal لكن مع القيم الموجودة

#### 10. إضافة منتج للـ POS لما تمسح باركود مش موجود
- لو الباركود مش في الـ system: رسالة "المنتج مش موجود — إضافة جديد؟"

#### 11. Receipt — تصميم احترافي للطباعة
- CSS `@media print` يخفي كل حاجة غير الفاتورة
- حجم ورقة receipt (58mm أو 80mm)
- لوجو المحل في الأعلى

#### 12. Daily closing — ربط بالبيانات الفعلية
- حاليًا الأرقام hardcoded
- لازم تتحسب من الفواتير اللي اتعملت النهارده

#### 13. Low stock — طلب شراء تلقائي
- زرار "طلب شراء" في تنبيهات المخزون يفتح Purchase Order مع المنتج جاهز

#### 14. Customers — debt payment يحدث الرصيد
- حاليًا بيعمل toast بس، مش بيحدث الـ debt value فعليًا

---

### 🟢 أولوية منخفضة (UX enhancements)

#### 15. Dashboard — فلتر الفترة الزمنية
- حاليًا الـ KPIs ثابتة "اليوم"
- محتاج: toggle اليوم / الأسبوع / الشهر يغير الأرقام

#### 16. Reports — Export PDF فعلي
- زرار Export موجود لكن مش شغال
- استخدام `window.print()` مع print CSS

#### 17. Settings — Receipt Preview
- في صفحة الإعدادات، تصميم الإيصال بيعرض preview live

#### 18. Notifications — Mark as read يشتغل فعليًا
- حاليًا الـ unread badge ثابت
- محتاج state management لـ read/unread

#### 19. Users — إضافة موظف تشتغل فعليًا
- Modal إضافة موظف موجود لكن بيعمل toast بس
- محتاج تضاف للـ USERS array

#### 20. AI Insights — ربط بالبيانات الفعلية
- حاليًا hardcoded text
- يحسب المنتجات قليلة المخزون، المبيعات الأقل، إلخ من الـ data الموجودة

---

## ترتيب التنفيذ المقترح

### Phase 1 — POS كامل (يكفي لعميل يشغل كاشير)
1. Stock validation (منع البيع لما المخزون ينتهي)
2. خصم على الفاتورة الكلية
3. Mixed payment
4. ربط عميل بالفاتورة
5. Edit product modal

### Phase 2 — ربط البيانات (يكفي للتقارير الحقيقية)
6. Shift ← POS integration
7. Daily closing ← real data
8. Notifications ← read state
9. Customer debt ← real update

### Phase 3 — Polish للبيع للعملاء
10. Print CSS احترافي
11. Dashboard period filter
12. AI Insights ← real data
13. Reports Export PDF
