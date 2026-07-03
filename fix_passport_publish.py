import sys
content = open('src/app/api/passport/[slug]/publish/route.ts').read()

old_return = """    return apiSuccess({
      cid: ipfsResult.cid,
      url: ipfsResult.url,
      verifiableCredential: vc,
    }, 200);"""

new_update = """    // Save the passport URL to the user record so it appears in the UI
    await prisma.user.update({
      where: { id: user.id },
      data: { passportUrl: ipfsResult.url },
    });

    return apiSuccess({
      cid: ipfsResult.cid,
      url: ipfsResult.url,
      verifiableCredential: vc,
    }, 200);"""

if old_return in content and 'passportUrl: ipfsResult.url' not in content:
    content = content.replace(old_return, new_update)

open('src/app/api/passport/[slug]/publish/route.ts', 'w').write(content)
