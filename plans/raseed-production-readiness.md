# خطة تحويل Raseed إلى منتج قابل للبيع

الخطة التجارية متعددة العملاء ومسار المثبت والاشتراكات والـ Cloud Backup موجودة في `plans/raseed-commercial-platform-plan.md`.

تحديث صلاحيات التشغيل: تم حصر دور الكاشير في أعمال الكاونتر، والسماح له بمرتجع فاتورة من نفس الفرع مع شيفت مفتوح، وربط رد النقد بتقفيل شيفت المرتجع. الفواتير ذات الدفع المختلط أو تغيير وسيلة الاسترداد تتطلب Owner/Manager.


آخر تدقيق فعلي: 2026-07-13

## الحكم التنفيذي

Raseed حاليًا **Release Candidate جيد وديمو قوي، لكنه غير جاهز للبيع أو التثبيت الذاتي على جهاز عميل نظيف**. الوظائف التجارية الأساسية موجودة بدرجة جيدة، لكن حزمة Windows الحالية لا تهيئ بيئة التشغيل كاملة، والاختبارات التشغيلية والحماية التجارية والتوقيع والتحديث ما زالت ناقصة.

قرار الإطلاق الحالي: **NO-GO للبيع العام**، و**GO مشروط لتجربة Pilot تحت إشراف المطور** بعد إغلاق بنود P0 أدناه.

## ما تم تنفيذه بعد التدقيق

- فصل إعدادات تشغيل Electron عن إعدادات النسخ الاحتياطي، وتوليد `JWT_SECRET` و`LICENSE_SECRET` محليًا لأول تشغيل بدل شحن قيم ثابتة.
- تخزين أسرار تشغيل desktop بتشفير النظام عند توفر Windows secure storage، واستيراد اتصال قاعدة البيانات مرة واحدة ثم حذف ملف الاستيراد النصي.
- تشغيل Prisma migrations قبل بدء backend في نسخة desktop المعبأة.
- ربط desktop API بالـ loopback `127.0.0.1` وإجبار backend desktop على الاستماع محليًا فقط، مع single-instance lock.
- إضافة إعداد Windows PostgreSQL ودليل تثبيت يدخلان ضمن release resources.
- فرض فحص الترخيص في backend للمستخدمين غير Super Admin، لا في توجيه الواجهة فقط.
- جعل health check public حتى يمكن لنسخة Electron التحقق منه فعليًا.
- توحيد NestJS على الإصدار 11 وإزالة نتائج High/Critical من `npm audit`؛ الواجهة الآن بلا نتائج audit.
- بوابة build Windows تمنع إصدارًا تجاريًا غير موقع افتراضيًا، وتنتج `SHA256SUMS.txt` مع الـ installer؛ البناء الداخلي غير الموقّع يتطلب opt-in صريحًا.
- إعداد Windows يضبط PostgreSQL كخدمة Automatic مع restart after failure، ونسخة Raseed المعبأة تسجل نفسها لتفتح تلقائيًا عند تسجيل دخول مستخدم ويندوز.

## ما تم التحقق منه

- واجهات POS والمنتجات والمخزون والفواتير والمرتجعات والمصاريف والعملاء والموردين والتقارير والشيفتات موجودة.
- RBAC وعزل المتجر والفرع موجودان في الـ backend.
- البيع يتحقق من المخزون داخل transaction، والواجهة تمنع تجاوز الكمية والخصومات والدفع الناقص.
- إنشاء عميل سريع والدفع المختلط واشتراط الشيفت موجودة.
- إعداد أول متجر وOwner موجود كـ onboarding داخل النظام بعد جاهزية قاعدة البيانات.
- النسخ الاحتياطي المشفر والاستعادة والتفعيل المرتبط بالجهاز موجودة كنسخة أولى.
- شعار Raseed موحد في الواجهات الأساسية والـ favicon.
- `frontend typecheck` و`backend build` ناجحان.
- اختبارات الواجهة: 3 ملفات، 8 اختبارات، كلها ناجحة.
- اختبارات الـ backend: 5 suites و23 اختبارًا موجودة، لكنها تخطيت بالكامل لأن قاعدة `raseed_test` غير متاحة وقت التدقيق.
- نسخة Windows الحالية: `release/RaseedSetup.exe`، إصدار `1.0.0-rc.1`، وحجم مجلد release نحو 665MB.
- dependency audit وقت التدقيق: 2 High و4 Moderate في workspace الرئيسي، وHigh في frontend؛ أبرزها `multer` و`react-router`، وتحتاج تحديثًا واختبار regression قبل الإصدار.

## إجابة سؤال الفلاشة بوضوح

### هل يكفي نقل `release` إلى جهاز عليه PostgreSQL؟

هذه كانت حالة نسخة RC1 القديمة بتاريخ 8 يوليو. مسار الـ installer تم إصلاحه في المصدر: النسخة التالية تضم PostgreSQL 17.7 وتجهزه تلقائيًا على جهاز Windows نظيف. لا تعتبر النسخة داخل `release` صالحة للبيع إلا بعد إعادة بنائها على Windows واختبارها في Windows نظيف والتوقيع الرقمي.

على الجهاز الجديد لا يحتاج العميل إلى Terminal أو إعداد متغيرات بيئة أو إنشاء user/database يدويًا. ما زال يحتاج فقط إلى صلاحية Administrator، مساحة كافية، ثم اختبار الطابعة والسكانر بعد التثبيت.

### ما الذي أُصلح مقارنةً بـ RC1؟

- تم إصلاح مسار backend المعبأ إلى `backend/dist/src/main.js`.
- تم جعل Prisma CLI production dependency وفحص وجوده داخل `app.asar` قبل قبول Release.
- تم تضمين PostgreSQL 17.7 pinned مع manifest للحجم وSHA-256، ورفض أي تنزيل ناقص أو معدل.
- الـ NSIS installer يعمل per-machine بصلاحية Admin، وينشئ PostgreSQL service وuser/database محدود الصلاحيات تلقائيًا على جهاز جديد.
- التطبيق يولد أسرار التشغيل محليًا، ويشغل migrations ثم يتحقق من `/api/health` قبل فتح الواجهة.

### شكل الفلاشة الصحيح بعد إغلاق P0

يجب أن تحتوي فلاشة التسليم على:

- `RaseedSetup.exe` موقع رقميًا.
- `SHA256SUMS.txt` للتحقق من سلامة الملف.
- PostgreSQL الرسمي المثبت داخل الـ installer، وليس رابط تنزيل وقت العميل.
- bootstrap installer مدمج، يثبت الخدمة وينشئ user/database ويولّد الأسرار ويشغّل migrations وhealth check.
- دليل عميل PDF قصير: التثبيت، الطابعة، النسخ الاحتياطي، الاستعادة، والدعم.
- ملف إصدار `RELEASE-NOTES.txt` ورقم build واضح.

لا يجب وضع source code أو `.env` أو كلمات مرور أو قاعدة بيانات عميل على الفلاشة.

## P0 — موانع البيع والإطلاق

### P0.1 مثبت Windows ذاتي التهيئة

- [x] إنشاء Setup bootstrap موحد وتضمين PostgreSQL pinned في النسخة.
- [x] توليد password قاعدة البيانات و`JWT_SECRET` و`LICENSE_SECRET` عشوائيًا لكل جهاز.
- [x] حفظ أسرار التطبيق باستخدام Electron safeStorage/DPAPI بعد استيراد one-time connection.
- [x] إنشاء database/user بأقل صلاحيات لازمة.
- [x] تشغيل `prisma migrate deploy` قبل بدء backend ومنع تشغيل نسختين من التطبيق.
- [x] إظهار شاشة خطأ للتشغيل وتسجيل installer log من دون طباعة كلمات المرور.
- [x] uninstall لا يحذف PostgreSQL أو بيانات العميل افتراضيًا.
- [ ] اختبار Windows 10/11 نظيف فعليًا وتوقيع installer قبل التسليم للعميل.

معيار القبول: جهاز Windows 10/11 نظيف يتم تثبيته وتشغيله وإنشاء أول متجر خلال 10 دقائق من دون Terminal أو تعديل ملفات.

### P0.2 إصلاح تشغيل Electron production

- [ ] وضع runtime config واضح خارج `app.asar` داخل `%ProgramData%/Raseed` أو `%AppData%/Raseed` حسب قرار multi-user.
- [ ] تثبيت API URL على `http://127.0.0.1:4000/api` في desktop build بدل الاعتماد على `/api` مع `file://`.
- [ ] ضبط `AUTH_COOKIE_SECURE=false` فقط للـ loopback desktop HTTP أو تشغيل loopback HTTPS بشهادة محلية.
- [ ] إزالة `disable-features=OutOfBlinkCors` بعد ضبط CORS الصحيح.
- [ ] جعل المنفذ قابلًا للاختيار أو اكتشاف التعارض، مع منع اتصال أجهزة الشبكة افتراضيًا.
- [ ] إضافة single-instance lock وإنهاء backend child بشكل موثوق.

معيار القبول: login/refresh/logout يعمل بعد إغلاق التطبيق وفتحه، ولا توجد أخطاء CORS أو cookies في packaged app.

### P0.3 migrations وترقية الإصدارات

- [ ] نسخ احتياطي تلقائي قبل كل migration.
- [ ] تشغيل migrations مرة واحدة مع سجل version ونتيجة واضحة.
- [ ] اختبار ترقية قاعدة حقيقية من RC1 إلى الإصدار التالي.
- [ ] منع تشغيل إصدار أقدم على schema أحدث.
- [ ] خطة rollback موثقة ومجربة.

معيار القبول: ترقية نسخة تحتوي 10,000 فاتورة من دون فقد أو ازدواج بيانات.

### P0.4 اختبار دورة البيع الواقعية

- [ ] فتح شيفت -> بيع نقدي -> طباعة -> خصم مخزون -> تقفيل.
- [ ] بيع مختلط وبيع آجل وعميل جديد سريع.
- [ ] خصم صنف/فاتورة وحدود المخزون والتزامن بين كاشيرين.
- [ ] مرتجع كامل وجزئي مع restock وrefund.
- [ ] انقطاع التطبيق/الكهرباء أثناء الحفظ ثم التحقق من atomicity.
- [ ] اختبار طابعة 58mm و80mm وقارئ barcode فعلي.

معيار القبول: لا يمكن إنشاء فاتورة ناقصة أو خصم مخزون مرتين، وأرقام الشيفت تطابق الفواتير والمدفوعات.

### P0.5 النسخ الاحتياطي والاستعادة

- [ ] تعديل backup ليكون قابلًا للاستعادة على جهاز بديل بمفتاح recovery منفصل؛ حاليًا مرتبط ببصمة نفس الجهاز، وهذا يمنع التعافي عند تلفه.
- [ ] عدم استخدام default `LICENSE_SECRET` تحت أي ظرف production.
- [ ] كتابة backup ذريًا ثم التحقق منه قبل اعتباره ناجحًا.
- [ ] retention يومي/أسبوعي، ونسخة على USB أو cloud اختياريًا.
- [ ] زر Restore يتطلب تأكيدًا وbackup تلقائيًا للحالة الحالية.
- [ ] تمرين restore شهري على قاعدة منفصلة.

معيار القبول: استعادة آخر backup على جهاز جديد موثقًا خلال 30 دقيقة.

### P0.6 اختبارات بوابة الإصدار

- [ ] تجهيز `raseed_test` وتشغيل 23 اختبار backend بدل تخطيها.
- [ ] إضافة E2E packaged smoke test لأول تشغيل والتفعيل والـ onboarding والبيع.
- [ ] إضافة اختبارات POS totals/rounding/concurrency/returns/closing.
- [ ] منع build release إذا تم تخطي أي suite حرجة.
- [ ] إضافة CI على Windows للبناء والاختبار وإخراج checksum.

معيار القبول: pipeline أخضر بالكامل، ولا توجد اختبارات skipped حرجة.

## P1 — مطلوب قبل البيع التجاري الواسع

### P1.1 حماية الملكية والترخيص

الحالة الحالية لا تمنع النسخ الاحترافي: `app.asar` قابل للفك، وخوارزمية توليد المفتاح والـ secret الافتراضي داخل التطبيق، والتحقق الأساسي في توجيه الواجهة لا في كل API محمي.

- [ ] لا تشحن سرًا قادرًا على إصدار تراخيص داخل التطبيق؛ استخدم توقيع asymmetric: المفتاح الخاص عندك فقط، والمفتاح العام داخل التطبيق.
- [ ] license payload موقع يحتوي customer/device/product/expiry/features/version، والتحقق offline بالمفتاح العام.
- [ ] إضافة LicenseGuard في الـ backend على العمليات التجارية، مع grace period محدود.
- [ ] لوحة إصدار وإلغاء ونقل تراخيص وسجل activations.
- [ ] آلية نقل جهاز قانونية عبر recovery code أو deactivation.
- [ ] code signing certificate لـ EXE/MSI وتوقيع كل إصدار.
- [ ] obfuscation اختياري بعد القياس، مع إدراك أنه يؤخر النسخ ولا يمنعه.
- [ ] اتفاقية ترخيص EULA، عقد بيع/اشتراك، سياسة دعم وخصوصية وملكية فكرية باسم المالك الحقيقي.
- [ ] تغيير `author: OpenAI Codex` إلى اسم الشركة/المالك وإضافة copyright وبيانات المنتج.

قاعدة مهمة: لا يوجد برنامج desktop غير قابل للنسخ 100%. الحماية الصحيحة مزيج من توقيع تراخيص، خدمة ودعم وتحديثات، عقود، وعدم شحن مفاتيح خاصة.

### P1.2 التوقيع والتحديث والإصدارات

- [ ] Semantic versioning وقناة stable/beta.
- [ ] توقيع Windows لتقليل SmartScreen warnings.
- [ ] auto-update موقّع مع rollback، أو updater يدوي موثق في أول إصدار.
- [ ] release notes وchecksum وSBOM.
- [ ] الاحتفاظ بآخر نسختين installer قابلتين للاسترجاع.
- [ ] فصل release artifacts عن source repo وعدم تسليم `win-unpacked` للعميل.

### P1.3 تقليل الحزمة وسطح الهجوم

- [ ] عدم تضمين `node_modules/**` بالكامل؛ حزم production dependencies فقط.
- [ ] استبعاد Jest, TypeScript, Nest CLI, Electron builder, docs/tests/source maps من installer.
- [ ] مراجعة native Prisma binaries الخاصة بـ Windows x64 فقط.
- [ ] توحيد package manager وحذف lockfile المكرر بعد التأكد؛ حاليًا يوجد root وfrontend lock مختلفان.
- [ ] تحديث `multer`/Nest platform لمعالجة مشكلات DoS في upload، ثم اختبار import/upload والإلغاء أثناء الرفع.
- [ ] تحديث `react-router` إلى إصدار مصحح، ثم اختبار redirects والحماية والمسارات كلها.
- [ ] معالجة نتائج `file-type` و`uuid` المتوسطة أو توثيق عدم قابلية الاستغلال إن تعذر التحديث.
- [ ] تشغيل dependency audit في CI ومنع High/Critical غير المصرح بها.

معيار القبول: installer أصغر بوضوح، ومحتواه معروف عبر manifest/SBOM ولا يحتوي أدوات تطوير.

### P1.4 الأمان التشغيلي

- [ ] bind للـ backend على `127.0.0.1` افتراضيًا، وFirewall rule فقط إذا تم تفعيل LAN عمدًا.
- [ ] تشفير أسرار التشغيل محليًا وتقييد ACL لمجلد البيانات.
- [ ] حماية login وactivation وpublic demo endpoints بمعدلات منفصلة.
- [ ] مراجعة upload/import ضد zip bombs وCSV formula injection والملفات الضخمة.
- [ ] audit log لا يمكن للمستخدم العادي حذفه، مع rotation للسجلات.
- [ ] CSP مناسبة بدل تعطيلها بالكامل.
- [ ] threat model مختصر: سرقة جهاز، موظف خبيث، ransomware، تعديل installer، فقد قاعدة البيانات.

### P1.5 المحاسبة ودقة البيانات

- [ ] تحديد سياسة rounding والعملة والضرائب والخصومات وتطبيق Decimal موحدًا.
- [ ] منع تعديل فاتورة بعد اعتمادها؛ التصحيح بمرتجع/إشعار واضح.
- [ ] أرقام فواتير غير متكررة لكل فرع مع اختبار concurrency.
- [ ] reconciliation يومي: cash/card/wallet/Instapay مقابل الشيفت.
- [ ] تصدير محاسبي وPDF حقيقي إذا كان ضمن وعد البيع.
- [ ] مراجعة متطلبات الفاتورة والضرائب في السوق الذي سيباع فيه المنتج قبل التسويق.

## P2 — UX وجودة المنتج

- [ ] جلسات اختبار مع 3 كاشيرين فعليين، وقياس زمن أول فاتورة والأخطاء.
- [ ] توحيد loading/empty/error/retry في كل الصفحات.
- [ ] منع فقد النماذج عند الرجوع أو انقطاع الشبكة المحلية.
- [ ] تحسين الجداول للشاشات 1366x768؛ الحد الأدنى الحالي لنافذة POS هو 1200x800 وقد لا يلائم أجهزة قديمة.
- [ ] full keyboard flow للـ POS وfocus واضح ودعم scanner سريع.
- [ ] tooltips وaccessible labels للأزرار الأيقونية.
- [ ] حالات offline/backend restarting مفهومة بدل شاشة بيضاء.
- [ ] طباعة receipt من Electron بطابعة محددة ومن دون dialog اختياريًا.
- [ ] حذف/دمج الخدمات القديمة التي ترمي `integration is planned` بعد إثبات عدم استخدامها.
- [ ] إزالة `frontend/src/app/GeneratedApp.backup.tsx` من شجرة العمل بعد التأكد أنه غير مستخدم؛ هو ignored حاليًا وليس جزءًا من المنتج.

## قرار الوثائق والتنظيف

### ملفات يجب الاحتفاظ بها

- `README.md`: بوابة المشروع للمطور، وليس زائدًا.
- `docs/LOCAL_SETUP.md`, `ENVIRONMENT.md`, `SECURITY.md`, `BACKUP.md`: مراجع تشغيل متخصصة.
- `docs/SHOP_DEPLOYMENT_CHECKLIST.md`: يتحول إلى checklist فني للتثبيت التجريبي.
- هذه الخطة: المصدر الوحيد لحالة الجاهزية الحالية.

### ملفات مرشحة للدمج ثم الحذف

- `docs/PROJECT_AUDIT_REPORT.md` و`docs/PROJECT_STATUS_REPORT_2026-07-08.md`: snapshots قديمة وطويلة.
- `docs/REAL_PROJECT_EXECUTION_PLAN.md`, `docs/ROADMAP.md`, `docs/TODO.md`: تتداخل مع هذه الخطة.
- `docs/PRODUCTION_CHECKLIST.md` و`docs/RELEASE_CHECKLIST.md`: يدمجان في checklist واحدة قابلة للتنفيذ.
- `plans/raseed-improvements.md` وملف خطة الـ attachment القديم: يراجع أي بند غير منقول ثم يحذفان.

لم يتم حذف هذه الملفات أثناء التدقيق لأن بعضها قد يحتوي قرارات تاريخية غير منقولة بعد. الحذف الآمن يكون في commit مستقل بعد diff وموافقة على القائمة النهائية. ملفات README داخل `node_modules` ليست وثائق مشروع ولا تُحذف منفردة؛ `node_modules` أصلًا لا يُسلّم ولا يُرفع إلى Git.

## ترتيب التنفيذ المقترح

### Sprint 1 — Installer يعمل على جهاز نظيف

1. runtime config + secrets + API/cookie fixes.
2. PostgreSQL bootstrap + migrations + first-run health screen.
3. Windows clean-VM test وتوثيق محتويات فلاشة التسليم.

### Sprint 2 — عدم فقد المال أو البيانات

1. backend test database وتشغيل كل suites.
2. سيناريوهات البيع/الشيفت/المرتجع/concurrency والطباعة.
3. backup قابل للاستعادة على جهاز بديل وتمرين disaster recovery.

### Sprint 3 — قابل للبيع والحماية

1. asymmetric licensing وLicenseGuard.
2. code signing وrelease pipeline وchecksum/SBOM.
3. production-only packaging وتقليل الحجم وإدارة التحديث.

### Sprint 4 — Pilot حقيقي

1. تركيب عند محل واحد ببيانات غير حساسة أول أسبوع.
2. مراقبة logs والنسخ الاحتياطي والتقفيل اليومي والطباعة.
3. إصلاح نتائج الاستخدام ثم إصدار `1.0.0` stable.

## تعريف Done للإصدار 1.0

- تثبيت نظيف وتحديث وإزالة موثقة على Windows 10/11.
- كل الاختبارات الحرجة تعمل وتنجح بلا skip.
- بيع وشيفت ومرتجع وطباعة وتزامن مجربة فعليًا.
- backup يُستعاد على جهاز آخر.
- installer موقّع وله checksum ولا يحتوي secrets أو dev tools.
- الترخيص موقّع asymmetric ومفروض من backend.
- لا توجد كلمات مرور demo أو secrets افتراضية في production.
- وثائق عميل ودعم واتفاقية ترخيص موجودة.
- Pilot ناجح لمدة تشغيل متفق عليها قبل البيع العام.
