import sys
content = open('src/app/api/did-document/route.ts').read()

if 'import { deriveUserRootKey }' not in content:
    content = content.replace(
        "import { createIssuerDid } from \"@/lib/did\";",
        "import { createIssuerDid } from \"@/lib/did\";\nimport { deriveUserRootKey } from \"@/lib/sovereign-keys\";"
    )

old_user_doc = "const doc = buildDidDocument(user.did);"
new_user_doc = """      // Derive public key from piUid (stable, secure, automated)
      const { publicKey } = deriveUserRootKey(user.piUid!);
      const doc = buildDidDocument(user.did, publicKey);"""

if old_user_doc in content:
    content = content.replace(old_user_doc, new_user_doc)

open('src/app/api/did-document/route.ts', 'w').write(content)
