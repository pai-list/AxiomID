import sys
import os

def add_metadata(path, title, description):
    if not os.path.exists(path): return
    content = open(path).read()
    if "export const metadata" in content: return

    import_stmt = "import { Metadata } from 'next';\n"
    metadata_stmt = f"""
export const metadata: Metadata = {{
  title: '{title}',
  description: '{description}',
}};
"""
    if "import" in content:
        content = import_stmt + metadata_stmt + content
    else:
        content = metadata_stmt + content
    open(path, 'w').write(content)

add_metadata('src/app/leaderboard/page.tsx', 'Leaderboard', 'Top AxiomID users ranked by XP and trust score.')
add_metadata('src/app/explorer/page.tsx', 'Agent Explorer', 'Browse and discover verified AI agents on the AxiomID network.')
add_metadata('src/app/docs/page.tsx', 'Documentation', 'Learn how to integrate AxiomID, manage stamps, and build sovereign agents.')
