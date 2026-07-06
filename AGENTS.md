# ⚡ Quick Reference: Top 10 Engineering Rules | أهم 10 قواعد هندسية ۞

1. **المراقبة والصدق (Muraqabah & Honesty):** المراقبة الذاتية والصدق المطلق في كتابة وتجريب الأكواد. لا تكذب أبداً، و"لا أعلم" إجابة شريفة ومطلوبة عند الشك.
2. **الالتزام بـ TypeScript الصارم (Strict TS):** تفعيل خيار `"strict": true` إلزامي بشكل كامل، ويُمنع منعاً باتاً استخدام تحويلات النوع الالتفافية مثل `as any`.
3. **قيود بيئة Pi SDK:** حظر استيراد أو تشغيل مكتبة Pi SDK خارج نطاق المتصفح (Browser-only). راجع [Pi SDK Guidelines](docs/engineering/pi.md) للتفاصيل.
4. **كشف الـ Sandbox الديناميكي:** يُمنع تماماً كتابة قيم ثابتة لـ `sandbox: true/false`. استخدم `determineSandboxMode()`.
5. **محاكاة متصفح Pi في الاختبارات:** استخدم ترويسة `User-Agent` لمتصفح Pi في الاختبارات الوهمية.
6. **مساعد الترجمة ثنائي اللغة (Bilingual translation):** استخدم `const t = (en, ar) => (language === "en" ? en : ar)` عند الحاجة للغتين معاً.
7. **منع الصفر السالب (Clamp Negative Zero):** تأكد من عدم إرجاع الدوال الرياضية للقيمة `-0`.
8. **استخدام مطابقات Jest القياسية:** استخدم `expect(Number.isFinite(val)).toBe(true)` بدلاً من المطابقات غير القياسية.
9. **وظائف Vercel بلا حالة (Stateless Functions):** تعامل مع الوظائف ككيانات مؤقتة.
10. **سجلات الالتزام التاريخية القصصية (Chronicle Commit):** صياغة الالتزامات بنسق IQRA Chronicle.

---

## 📚 Documentation Index

For detailed guidelines, architecture, and security policies, please refer to the consolidated documentation:

* **[Architecture Docs](docs/architecture/index.md)**: Zero-Cost architecture, Sovereign Identity stack, D1 migration.
* **[Security Docs](docs/security/index.md)**: Core security practices, audit reports, and vulnerability reporting.
* **[Agents Docs](docs/agents/index.md)**: Agent workflow plans, next steps reports, and audit prompts.
* **[Deployment Docs](docs/deployment/index.md)**: Guides for deploying to Vercel and Cloudflare.
* **[Process Docs](docs/process/index.md)**: Contributing guidelines, branch strategy, and code of conduct.
* **[Engineering Docs](docs/engineering/index.md)**: TypeScript, testing, Pi SDK, and style guidelines.

*(See individual docs/ folders for full details to avoid duplication).*
