import test from 'node:test';
import { calculateTier, getLevelProgress, getNextLevelXP, TIERS } from './tiers.ts';

test('Tiers Utility', async () => {
  await test('calculateTier', async () => {
    const assert = await import('node:assert/strict');
    assert.strictEqual(calculateTier(0), 'Visitor');
    assert.strictEqual(calculateTier(50), 'Visitor');
    assert.strictEqual(calculateTier(99), 'Visitor');

    assert.strictEqual(calculateTier(100), 'Citizen');
    assert.strictEqual(calculateTier(300), 'Citizen');
    assert.strictEqual(calculateTier(499), 'Citizen');

    assert.strictEqual(calculateTier(500), 'Validator');
    assert.strictEqual(calculateTier(750), 'Validator');
    assert.strictEqual(calculateTier(999), 'Validator');

    assert.strictEqual(calculateTier(1000), 'Sovereign');
    assert.strictEqual(calculateTier(1500), 'Sovereign');

    assert.strictEqual(calculateTier(-10), 'Visitor');
  });

  await test('getLevelProgress', async () => {
    const assert = await import('node:assert/strict');
    // Visitor tier (0-100 XP)
    assert.strictEqual(getLevelProgress(0, 'Visitor'), 0);
    assert.strictEqual(getLevelProgress(50, 'Visitor'), 50);
    assert.strictEqual(getLevelProgress(100, 'Visitor'), 100);

    // Citizen tier (100-500 XP)
    assert.strictEqual(getLevelProgress(100, 'Citizen'), 0);
    assert.strictEqual(getLevelProgress(300, 'Citizen'), 50);
    assert.strictEqual(getLevelProgress(500, 'Citizen'), 100);

    // Validator tier (500-1000 XP)
    assert.strictEqual(getLevelProgress(500, 'Validator'), 0);
    assert.strictEqual(getLevelProgress(750, 'Validator'), 50);
    assert.strictEqual(getLevelProgress(1000, 'Validator'), 100);

    // Sovereign tier
    assert.strictEqual(getLevelProgress(1000, 'Sovereign'), 100);
    assert.strictEqual(getLevelProgress(1500, 'Sovereign'), 100);

    // Clamping
    assert.strictEqual(getLevelProgress(-10, 'Visitor'), 0);
    assert.strictEqual(getLevelProgress(150, 'Visitor'), 100);
    assert.strictEqual(getLevelProgress(50, 'Citizen'), 0);
    assert.strictEqual(getLevelProgress(600, 'Citizen'), 100);
  });

  await test('getNextLevelXP', async () => {
    const assert = await import('node:assert/strict');
    assert.strictEqual(getNextLevelXP('Visitor'), TIERS.Citizen);
    assert.strictEqual(getNextLevelXP('Citizen'), TIERS.Validator);
    assert.strictEqual(getNextLevelXP('Validator'), TIERS.Sovereign);
    assert.strictEqual(getNextLevelXP('Sovereign'), null);
  });
});
