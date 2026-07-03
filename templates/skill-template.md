## الغرض — Purpose
<!-- TODO: Define what this skill does in 1-2 sentences. Required. -->

## مبدأ التوافق — Principle Alignment
تتوافق هذه المهارة مع مبادئ SOUL من خلال تحديد المبدأ المناسب (اليقظة / التصحيح / السباعية / الأخلاقي / المراجعة الذاتية).
<!-- TODO: Describe which active SOUL principle this skill serves.
     Vigilance (Muraqabah) / Correction (Tawbah) / Septet (Sab'iyyah) / Ethical / Self-Review.

     Required. -->

## سير التشغيل — Operational Flow
1. استقبال المدخلات والتحقق من صحة تكامل الطلب.
   Receive input and validate request integrity.
2. التحقق من هوية العميل (AxiomID DID) وصلاحيات الوصول.
   Verify agent identity (AxiomID DID) and access permissions.
3. معالجة البيانات وتنفيذ المنطق البرمجي الأساسي للمهارة.
   Process data and execute the skill's core logic.
4. توثيق المخرجات وتوقيعها رقمياً لضمان سلامة البيانات.
   Attest and digitally sign outputs to ensure data integrity.
5. إعادة النتيجة النهائية وتحديث السجل اللامركزي (Ledger) عند الضرورة.
   Return the final result and update the decentralized Ledger if necessary.

## أنماط الفشل — Failure Modes
| النمط (Mode) | الكشف (Detection) | الاسترداد (Recovery) |
| :--- | :--- | :--- |
| فشل الهوية (Identity Failure) | توقيع غير صالح (Invalid Signature) | رفض الطلب مع رمز الخطأ AXIOM_E401 / Reject request with AXIOM_E401 |
| تجاوز المهلة (Timeout) | مراقب التنفيذ (Execution Watchdog) | إلغاء العملية وإعادة المحاولة (حد أقصى 3 دورات مع تراجع أسي) / Cancel and retry (max 3 cycles with exponential backoff) |

## الوسوم — Tags
axiom-identity, agent-skill, decentralized-logic
