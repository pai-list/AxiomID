import json

data = {
    "branch_name": "jules-tests-action-configs-pr",
    "commit_message": "🧪 Add tests for action configurations",
    "title": "🧪 Add tests for action configurations",
    "description": """🎯 **What:** The testing gap addressed
The `src/lib/actions.ts` file lacked tests for its exported action configurations, leaving it vulnerable to accidental modifications of keys, types, or values.

📊 **Coverage:** What scenarios are now tested
- Verification that all expected core action keys are present in the `ACTIONS` object.
- Validation that every action has the correct property structure (`id` as string, `xp` as number greater than 0).
- Checking that all action IDs are unique to prevent collisions.
- Exact match verification for all current action configurations to prevent unintended value changes.
- Object mutability checks to document current state.

✨ **Result:** The improvement in test coverage
We now have full test coverage for `src/lib/actions.ts`, ensuring that configuration constants remain reliable and preventing regressions when new actions are added or existing ones are modified. All tests pass locally and in the full suite without regressions."""
}

with open("submit_data.json", "w") as f:
    json.dump(data, f)
