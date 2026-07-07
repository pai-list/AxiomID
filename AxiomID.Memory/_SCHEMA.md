---
tags: [schema, conventions, meta, reference]
status: evergreen
tier: tier-0
last_updated: 2026-05-29
ai_summary: "Full schema and conventions for the AxiomID.Memory Obsidian vault. Defines frontmatter fields, note tiers, linking conventions, and AI navigation protocol."
linked_notes: [HOME, SOUL, PROJECT_STATUS]
---

# _SCHEMA — AxiomID.Memory Vault Conventions

> `Tier: 0 · Meta` — هذا الملف يصف قواعد الـ vault نفسه.
> هذا الملف للوكيل البشري والبرمجي معاً — اقرأني قبل لمس أي ملف.

---

## 1. Where files live

| Scope | Path | Purpose |
|-------|------|---------|
| Root index | `HOME.md` | Map of Content — يبدأ منه الإنسان والوكيل |
| Soul | `SOUL.md` | الهوية الأخلاقية — دستور الروح |
| Rules | `PROJECT_STATUS.md` | حالة المشروع — المصدر الأساسي |
| Progress | `progress_log.md` | سجل التقدم المستمر — يُحدَّث مع كل جلسة |
| Schema | `_SCHEMA.md` | **(هذا الملف)** — قواعد الـ vault |
| Arabic notes | `*.md` | ملفات بالعربية للتوثيق المحلي |

---

## 2. Frontmatter schema

كل ملف في الـ vault **يجب** أن يبدأ بهذا الـ YAML frontmatter:

```yaml
---
tags: [tag1, tag2, ...]        # REQUIRED. موضوعات الملف. على الأقل tag واحد.
status: seedling | growing | evergreen  # REQUIRED. مرحلة النضج.
tier: tier-0 | tier-1 | tier-2  # REQUIRED. Tier 0 = Index, 1 = Living, 2 = Reference.
last_updated: YYYY-MM-DD        # REQUIRED. تاريخ آخر تحديث.
ai_summary: "..."               # RECOMMENDED. جملة واحدة للوكيل الذكي.
linked_notes: [file1, file2]    # OPTIONAL. روابط مباشرة لملفات ذات صلة.
---
```

### `status` values

| Value | Meaning | للوكيل البشري | للوكيل البرمجي |
|-------|---------|---------------|-----------------|
| `seedling` 🌱 | قيد الإنشاء — غير مكتمل | توقع تغييرات جذرية | اقرأ بحذر، قد يكون ناقصاً |
| `growing` 🌿 | في النمو — مكتمل جزئياً | يمكن الاعتماد عليه | استخدمه كمرجع مع تحقق |
| `evergreen` 🌳 | مستقر — مكتمل ومراجع | مرجع موثوق | المصدر الأساسي |

### `tier` values

| Tier | Meaning | أمثلة |
|------|---------|-------|
| `tier-0` | Index — الملاحة والمراجع | `HOME.md`, `_SCHEMA.md` |
| `tier-1` | Living — يتغير باستمرار | `progress_log.md` |
| `tier-2` | Reference — ثابت أو شبه ثابت | `SOUL.md`, `framework_design.md` |

---

## 3. Note structure conventions

كل ملف يتبع هذا الهيكل العام:

```markdown
---
tags: [example, reference]
status: evergreen
tier: tier-2
last_updated: 2026-05-29
ai_summary: "مختصر دقيق يصف محتوى الملف في سطر واحد"
linked_notes: [note1, note2]
---

# العنوان | Title

> `Tier: N · Category` — وصف مختصر
> `English parallel description`

---

## المحتوى

...
```

### Headings convention

- `#` — عنوان رئيسي واحد فقط (اسم الملف)
- `##` — أقسام رئيسية
- `###` — أقسام فرعية
- `####` — تفاصيل

### Tables

استخدم tables مع رؤوس عربية وإنجليزية:

```markdown
| الحقل | Field | الوصف |
|-------|-------|-------|
| القيمة | Value | Description |
```

### Code blocks

- `` ```python `` — لكود Python
- `` ```yaml `` — لملفات الإعدادات
- `` ```mermaid `` — للرسوم البيانية
- `` ```markdown `` — لأمثلة Markdown

---

## 4. Linking conventions

- استخدم `[[WikiLinks]]` للربط بين ملفات الـ vault
- الربط الكثيف = Vault قوي. اربط كل مفهوم بجذوره.
- كل ملف يجب أن يذكر `linked_notes` في frontmatter

### Link priority

1. `[[SOUL]]` — المرجع الأخلاقي الأعلى
2. `[[PROJECT_STATUS]]` — حالة المشروع
3. `[[HOME]]` — العودة للملاحة
4. `[[progress_log]]` — أين نحن الآن

---

## 5. AI Agent navigation protocol

عندما يقرأك وكيل ذكي (AI Agent):

### الخطوة 1: اقرأ `_SCHEMA.md`
افهم قواعد الـ vault قبل أن تلمس أي ملف.

### الخطوة 2: اقرأ `HOME.md`
افهم هيكل الـ vault بالكامل، خريطة التنقل، وحالة كل ملف.

### الخطوة 3: اقرأ `progress_log.md`
اعرف ما الذي تغير منذ آخر زيارة لك.

### الخطوة 4: اقرأ الملف المستهدف

### قواعد للوكيل البرمجي

1. **لا تعدل frontmatter** إلا بتعليمات صريحة
2. **لا تحذف محتوى** — أضف جديداً بجانب القديم
3. **حدّث `last_updated`** عند أي تعديل
4. **حدّث `progress_log.md`** بعد كل جلسة عمل
5. **زد كثافة الروابط** — اربط الملفات ببعضها

---

## 6. File naming

| Convention | Example |
|------------|---------|
| Arabic for local docs | `المشاكل_والإصلاحات.md` |
| English for core | `SOUL.md`, `HOME.md`, `PROJECT_STATUS.md` |
| Leading underscore for meta | `_SCHEMA.md` |
| snake_case for English | `repo_dna.md` |

---

## 7. Growth tracking

كل ملف له `status` يعكس نضجه:

```
🌱 seedling  ──→  🌿 growing  ──→  🌳 evergreen
     ↑                    ↑                    ↑
  جديد/غير مكتمل    مكتمل لكن قد يتغير    مستقر وموثوق
```

- الـ `progress_log.md` يتتبع التغييرات عبر الزمن
- الـ `HOME.md` يعرض خارطة النمو بشكل رسومي (Mermaid)

---

*هذا الملف نفسه من نوع `evergreen` — لا يتغير إلا بتغيير في conventions الـ vault.*
*آخر تحديث: 29 مايو 2026 — ۞*
