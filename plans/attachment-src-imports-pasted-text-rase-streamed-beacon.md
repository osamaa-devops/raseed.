# Plan: Raseed — Role-Based Access Control (RBAC)

## Context
حاليًا كل الأدوار بعد اللوجين بيشوفوا نفس الـ sidebar الكامل — الكاشير بيشوف التقارير والإعدادات والاشتراك، وموظف المخزون بيشوف الكاشير والمبيعات. ده غلط من ناحية UX والأمان. المطلوب كل دور يشوف بس اللي بيخصه.

## Critical File
**`src/app/App.tsx`** — كل التغييرات هنا بس.

---

## الأدوار والصلاحيات المطلوبة

### 🔴 Super Admin (`superadmin`)
- **الـ view الأولي:** `super-admin`
- **يشوف:** لوحة المنصة فقط — sidebar مختلف تمامًا
- **ما يشوفش:** أي صفحة من صفحات المحل

### 🟢 صاحب المحل (`owner`)
- **الـ view الأولي:** `dashboard`
- **يشوف:** كل الصفحات ما عدا `super-admin`

### 🟡 مدير (`manager`)
- **الـ view الأولي:** `dashboard`
- **يشوف:** dashboard, pos, shifts, end-of-day, products, categories, inventory, sales, returns, expenses, reports, suppliers, purchase-orders, customers, notifications, ai-insights, users (view only), activity-log, help
- **ما يشوفش:** subscription, settings, super-admin

### 🔵 كاشير (`cashier`)
- **الـ view الأولي:** `pos`
- **يشوف:** pos, shifts, notifications, help
- **ما يشوفش:** باقي الصفحات

### 🟠 موظف مخزون (`inventory`)
- **الـ view الأولي:** `inventory`
- **يشوف:** inventory, products (view), categories (view), suppliers, purchase-orders, notifications, help
- **ما يشوفش:** pos, sales, reports, users, settings, subscription

---

## التطبيق — 3 تغييرات فقط

### التغيير 1: `ROLE_VIEWS` map
أضف object ثابت يحدد الـ views المسموح بيها لكل دور:

```ts
const ROLE_VIEWS: Record<UserRole, View[]> = {
  superadmin: ["super-admin"],
  owner: [ /* كل الـ views ما عدا super-admin */ ],
  manager: ["dashboard","pos","shifts","end-of-day","products","categories",
            "inventory","sales","returns","expenses","reports","suppliers",
            "purchase-orders","customers","notifications","ai-insights",
            "users","activity-log","help"],
  cashier: ["pos","shifts","notifications","help"],
  inventory: ["inventory","products","categories","suppliers",
              "purchase-orders","notifications","help"],
};
```

### التغيير 2: `Sidebar` — فلترة الـ NAV_GROUPS
مرر `role` للـ `Sidebar`، وفلتر كل item بناءً على `ROLE_VIEWS[role]`:

```tsx
// في Sidebar، بدل عرض كل NAV_GROUPS:
const allowedViews = ROLE_VIEWS[role];
const visibleGroups = NAV_GROUPS
  .map(g => ({ ...g, items: g.items.filter(i => allowedViews.includes(i.id as View)) }))
  .filter(g => g.items.length > 0);
```

- الـ Super Admin يشوف sidebar مختلف — استبدل الـ `NAV_GROUPS` الكامل بـ `SUPER_ADMIN_NAV` ثابت:
```ts
const SUPER_ADMIN_NAV = [
  { label: "المنصة", items: [
    { id: "super-admin", label: "لوحة المنصة", icon: LayoutDashboard },
  ]}
];
```

### التغيير 3: `AppShell` — حماية الـ navigation
لو المستخدم حاول يروح لصفحة مش في صلاحياته (عن طريق كليك مباشر أو state خارجي)، اعمل redirect للـ view الأولي:

```tsx
// في navigate():
const navigate = (v: View) => {
  const allowed = ROLE_VIEWS[state.role];
  if (!allowed.includes(v)) return; // ignore unauthorized navigation
  setState({ ...state, view: v });
  setSidebarOpen(false);
};
```

---

## UX للكاشير — صفحة مختلفة
الكاشير بعد اللوجين يروح مباشرة لشاشة الكاشير (POS) بدون sidebar عريض. الـ sidebar يعرض 3-4 items بس — بسيط وسريع.

## UX للموظف مخزون  
يروح لصفحة المخزون مباشرة.

---

## Verification
1. سجل دخول كـ **كاشير** ← يروح لـ POS مباشرة، الـ sidebar فيه 4 items بس
2. سجل دخول كـ **موظف مخزون** ← يروح للمخزون، مفيش POS أو تقارير في الـ sidebar
3. سجل دخول كـ **مدير** ← يروح للـ dashboard، مفيش الاشتراك أو الإعدادات
4. سجل دخول كـ **صاحب محل** ← يشوف كل حاجة
5. سجل دخول كـ **سوبر أدمن** ← يشوف لوحة المنصة بس، الـ sidebar مختلف
