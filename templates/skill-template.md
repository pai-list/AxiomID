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
| RATE_LIMITED | HTTP 429 response | Exponential backoff |
| TIMEOUT | No response > 30s | Retry up to 3 times |
| AUTH_ERROR | 401 Unauthorized | Refresh session/token |
| INVALID_DATA | Validation failure | Log and notify user |

## الوسوم — Tags
<!-- Optional: comma-separated tags. -->
