import sys
content = open('src/components/dashboard/QuickLinksCard.tsx').read()

if 'import { useCallback, useMemo, useState }' not in content:
    content = content.replace(
        'import { useMemo } from "react";\nimport { useState } from "react";',
        'import { useCallback, useMemo, useState } from "react";'
    )

old_handle = """  const handlePublish = async () => {
    setPublishing(true)"""

# I need to find the whole handlePublish block and wrap it in useCallback
import re
pattern = r"const handlePublish = async \(\) => \{.*?setPublishing\(false\)\n    \}\);\n  \};"
match = re.search(pattern, content, re.DOTALL)
if match:
    old_block = match.group(0)
    new_block = f"""  const handlePublish = useCallback(async () => {{
    setPublishing(true);
    const promise = fetch(`/api/passport/${{passportSlug}}/publish`, {{ method: 'POST' }});

    toast.promise(promise, {{
      loading: 'Publishing passport to IPFS & Stellar...',
      success: (res) => {{
        if (!res.ok) throw new Error('Publish failed');
        // Simple page reload to update passportUrl from server state
        setTimeout(() => window.location.reload(), 1500);
        return 'Passport published successfully!';
      }},
      error: 'Failed to publish passport',
      finally: () => setPublishing(false)
    }});
  }}, [passportSlug, toast]);"""
  # wait, toast comes from sonner, it's stable but should be in deps if referenced.
  # actually sonner toast is a module import, so it doesn't strictly need to be in deps but lint might complain.
  # I will add it if I can verify it's in scope.

content = re.sub(pattern, new_block, content, flags=re.DOTALL)

# Update useMemo dependencies
content = content.replace(
    '], [t, passportSlug, did, passportUrl]);',
    '], [t, passportSlug, did, passportUrl, handlePublish, publishing]);'
)

open('src/components/dashboard/QuickLinksCard.tsx', 'w').write(content)
