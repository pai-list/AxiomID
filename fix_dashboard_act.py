import re

with open('src/__tests__/app/dashboard-page.test.tsx', 'r') as f:
    content = f.read()

# Add fetch mock to beforeEach
content = content.replace(
    'beforeEach(() => {',
    'beforeEach(() => {\n  global.fetch = jest.fn().mockResolvedValue({\n    ok: true,\n    json: async () => ({ skills: [] }),\n  }) as any;'
)

# Replace renderWithProvider calls with awaited act-wrapped versions or just wrap the call
# Actually, the easiest way to avoid act warnings for mount-effects is to use findBy queries.

with open('src/__tests__/app/dashboard-page.test.tsx', 'w') as f:
    f.write(content)
