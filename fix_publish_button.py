import sys
content = open('src/components/dashboard/QuickLinksCard.tsx').read()

if 'const [publishing, setPublishing] = useState(false);' not in content:
    content = content.replace(
        'import { useLanguage } from "@/app/context/language-context";',
        'import { useState } from "react";\nimport { useLanguage } from "@/app/context/language-context";\nimport { toast } from "sonner";'
    )

    content = content.replace(
        'const { t } = useLanguage();',
        'const { t } = useLanguage();\n  const [publishing, setPublishing] = useState(false);'
    )

    publish_logic = """
  const handlePublish = async () => {
    setPublishing(true);
    const promise = fetch(`/api/passport/${passportSlug}/publish`, { method: 'POST' });

    toast.promise(promise, {
      loading: 'Publishing passport to IPFS & Stellar...',
      success: (res) => {
        if (!res.ok) throw new Error('Publish failed');
        // Simple page reload to update passportUrl from server state
        setTimeout(() => window.location.reload(), 1500);
        return 'Passport published successfully!';
      },
      error: 'Failed to publish passport',
      finally: () => setPublishing(false)
    });
  };
"""
    content = content.replace('const { t } = useLanguage();', 'const { t } = useLanguage();' + publish_logic)

    old_children = 'children: passportUrl ? ["link1", "link2", "link3"] : ["link1", "link2"],'
    new_children = 'children: passportUrl ? ["link1", "link2", "link3"] : ["link1", "link2", "publish"],'
    content = content.replace(old_children, new_children)

    old_elements = 'elements: {'
    new_elements = """elements: {
      publish: {
        type: "Button",
        props: {
          label: publishing ? "Publishing..." : "Publish Passport",
          onClick: handlePublish,
          variant: "outline",
          size: "sm",
          icon: "upload",
          loading: publishing,
          className: "mt-2 w-full font-mono text-[10px] tracking-widest uppercase border-axiom-purple/30 text-axiom-purple hover:bg-axiom-purple/10"
        }
      },"""
    content = content.replace(old_elements, new_elements)

open('src/components/dashboard/QuickLinksCard.tsx', 'w').write(content)
