import re

with open('src/__tests__/app/dashboard-page.test.tsx', 'r') as f:
    content = f.read()

# Mock fetch in beforeEach if not already done
if 'global.fetch = jest.fn()' not in content:
    content = content.replace(
        'beforeEach(() => {',
        'beforeEach(() => {\n  global.fetch = jest.fn().mockResolvedValue({\n    ok: true,\n    json: async () => ({ skills: [] }),\n  }) as any;'
    )

# Change renderWithProvider to be async and handle act
content = content.replace(
    'const renderWithProvider = (ui: React.ReactElement) => {',
    'const renderWithProvider = async (ui: React.ReactElement) => {\n  let result: any;\n  await act(async () => {\n    result = render('
)
content = content.replace(
    '    </JSONUIProvider>\n  );\n};',
    '    </JSONUIProvider>\n    );\n  });\n  return result;\n};'
)

# Update all calls to renderWithProvider to be awaited, and make it blocks async
content = content.replace('it("', 'async it("') # This is a bit too broad, but let's see.
# Better: regex replace it( with async it(
content = re.sub(r'it\("', 'it(async () => "', content) # Wait, it is it("description", () => {
content = re.sub(r'it\("([^"]+)", \(\) => \{', r'it("\1", async () => {', content)

# Await renderWithProvider
content = content.replace('renderWithProvider(', 'await renderWithProvider(')

with open('src/__tests__/app/dashboard-page.test.tsx', 'w') as f:
    f.write(content)
