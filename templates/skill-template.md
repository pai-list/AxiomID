## الغرض — Purpose
<!-- TODO: Define what this skill does in 1-2 sentences. Required. -->

## مبدأ التوافق — Principle Alignment
<!-- TODO: Describe which SOUL principle this skill serves.
     Vigilance / Correction / Ledger / Triad / Septet / Compounding.

     Required. -->

## سير التشغيل — Operational Flow
<!-- TODO: List numbered steps describing execution. Required.
     1. Step one
     2. Step two
     3. Step three -->

## أنماط الفشل — Failure Modes
| النمط (Mode) | الكشف (Detection) | الاسترداد (Recovery) |
| :--- | :--- | :--- |
| RATE_LIMITED | HTTP 429 response / استجابة 429 | Exponential backoff / تراجع أسي |
| TIMEOUT | No response > 30s / لا توجد استجابة > 30 ثانية | Retry up to 3 times / إعادة المحاولة حتى 3 مرات |
| AUTH_ERROR | 401 Unauthorized / 401 غير مصرح به | Refresh session/token / تحديث الجلسة/الرمز |
| INVALID_DATA | Validation failure / فشل التحقق من البيانات | Log and notify user / تسجيل وتنبيه المستخدم |
| TODO: Custom Mode | TODO: Detection | TODO: Recovery |

## الوسوم — Tags
<!-- Optional: comma-separated tags. -->
