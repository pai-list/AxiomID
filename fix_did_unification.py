import sys
content = open('src/lib/did.ts').read()

old_func = """export function createUserDid(userId: string): string {
  UserIdSchema.parse(userId);
  return `${DID_METHOD}:user-${userId}`;
}"""

new_func = """/**
 * @deprecated Use createPiDid() where possible for consistent Pi Network DID resolution.
 * If user has no Pi UID (unlikely in this app), falls back to user-id format.
 */
export function createUserDid(userId: string, piUid?: string): string {
  UserIdSchema.parse(userId);
  if (piUid) {
    return createPiDid(piUid);
  }
  return `${DID_METHOD}:user-${userId}`;
}"""

if old_func in content:
    content = content.replace(old_func, new_func)

open('src/lib/did.ts', 'w').write(content)
