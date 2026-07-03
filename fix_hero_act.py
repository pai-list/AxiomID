import re

with open('src/__tests__/app/passport-hero.test.tsx', 'r') as f:
    content = f.read()

# Fix renderHome to wrap render in act and await it if possible
content = content.replace(
    'function renderHome() {\n  render(<Home />);\n  act(() => { jest.advanceTimersByTime(101); });\n}',
    'async function renderHome() {\n  await act(async () => {\n    render(<Home />);\n  });\n  await act(async () => {\n    jest.advanceTimersByTime(101);\n  });\n}'
)

# Update calls to renderHome to be awaited
content = content.replace('renderHome();', 'await renderHome();')

with open('src/__tests__/app/passport-hero.test.tsx', 'w') as f:
    f.write(content)
