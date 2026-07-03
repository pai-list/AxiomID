import re

with open('src/__tests__/app/passport-hero.test.tsx', 'r') as f:
    content = f.read()

# Fix renderHome to be async
content = re.sub(
    r'function renderHome\(\) \{',
    r'async function renderHome() {',
    content
)

# Use regex to make it blocks async and await renderHome
content = re.sub(r'it\("([^"]+)", \(\) => \{', r'it("\1", async () => {', content)
# Ensure renderHome is awaited (I already did a plain replace, let's make sure it's correct)
if 'await renderHome()' not in content:
    content = content.replace('renderHome()', 'await renderHome()')

with open('src/__tests__/app/passport-hero.test.tsx', 'w') as f:
    f.write(content)
