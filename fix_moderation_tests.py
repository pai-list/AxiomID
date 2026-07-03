import re

with open('src/__tests__/api/skills-moderation.test.ts', 'r') as f:
    content = f.read()

# Replace UUIDs with standard v4-like ones (version 4, variant 8)
content = content.replace("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "a1b2c3d4-e5f6-4890-8bcd-ef1234567890")
content = content.replace("b2c3d4e5-f6a7-8901-bcde-f12345678901", "b2c3d4e5-f6a7-4901-abcd-f12345678901")

# Ensure mockPrisma.skill.update is mocked in the problematic tests
# Or better, mock it in a global beforeEach for the POST block

content = content.replace(
    'describe("POST /api/admin/skills/[id] — business logic", () => {\n  beforeEach(() => {\n    jest.clearAllMocks();',
    'describe("POST /api/admin/skills/[id] — business logic", () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    mockPrisma.skill.update.mockResolvedValue({} as any);'
)

# Also fix the "allows admin user" test
content = content.replace(
    '    mockPrisma.skillModeration.update.mockResolvedValue(MOCK_MODERATION);\n\n    const req = mockPostRequest({ action: "approve" });',
    '    mockPrisma.skillModeration.update.mockResolvedValue(MOCK_MODERATION);\n    mockPrisma.skill.update.mockResolvedValue({} as any);\n\n    const req = mockPostRequest({ action: "approve" });'
)

with open('src/__tests__/api/skills-moderation.test.ts', 'w') as f:
    f.write(content)
