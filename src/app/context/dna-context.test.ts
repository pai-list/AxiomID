import { calculateLevel, getNextLevelXP, getLevelProgress, LEVEL_THRESHOLDS } from './dna-context';

describe('DNA Context Helpers', () => {
    describe('calculateLevel', () => {
        it('should return "ghost" for XP below spark threshold', () => {
            expect(calculateLevel(0)).toBe('ghost');
            expect(calculateLevel(5)).toBe('ghost');
            expect(calculateLevel(9)).toBe('ghost');
        });

        it('should return "spark" for XP between spark and pulse thresholds', () => {
            expect(calculateLevel(10)).toBe('spark');
            expect(calculateLevel(20)).toBe('spark');
            expect(calculateLevel(29)).toBe('spark');
        });

        it('should return "pulse" for XP between pulse and axiom thresholds', () => {
            expect(calculateLevel(30)).toBe('pulse');
            expect(calculateLevel(50)).toBe('pulse');
            expect(calculateLevel(69)).toBe('pulse');
        });

        it('should return "axiom" for XP at or above axiom threshold', () => {
            expect(calculateLevel(70)).toBe('axiom');
            expect(calculateLevel(100)).toBe('axiom');
            expect(calculateLevel(1000)).toBe('axiom');
        });

        it('should handle negative XP gracefully (default to ghost)', () => {
            // Assuming XP shouldn't be negative, but if it is, it should be ghost
            expect(calculateLevel(-10)).toBe('ghost');
        });
    });

    describe('getNextLevelXP', () => {
        it('should return spark threshold for ghost level', () => {
            expect(getNextLevelXP('ghost')).toBe(LEVEL_THRESHOLDS.spark);
        });

        it('should return pulse threshold for spark level', () => {
            expect(getNextLevelXP('spark')).toBe(LEVEL_THRESHOLDS.pulse);
        });

        it('should return axiom threshold for pulse level', () => {
            expect(getNextLevelXP('pulse')).toBe(LEVEL_THRESHOLDS.axiom);
        });

        it('should return null for axiom level', () => {
            expect(getNextLevelXP('axiom')).toBeNull();
        });
    });

    describe('getLevelProgress', () => {
        // Ghost: 0 - 10 (range 10)
        it('should calculate correct progress for ghost level', () => {
            expect(getLevelProgress(0, 'ghost')).toBe(0);
            expect(getLevelProgress(5, 'ghost')).toBe(50);
            expect(getLevelProgress(10, 'ghost')).toBe(100);
        });

        // Spark: 10 - 30 (range 20)
        it('should calculate correct progress for spark level', () => {
            expect(getLevelProgress(10, 'spark')).toBe(0);
            expect(getLevelProgress(20, 'spark')).toBe(50);
            expect(getLevelProgress(30, 'spark')).toBe(100);
        });

        // Pulse: 30 - 70 (range 40)
        it('should calculate correct progress for pulse level', () => {
            expect(getLevelProgress(30, 'pulse')).toBe(0);
            expect(getLevelProgress(50, 'pulse')).toBe(50);
            expect(getLevelProgress(70, 'pulse')).toBe(100);
        });

        // Axiom: 70+ (max level)
        it('should always return 100% for axiom level', () => {
            expect(getLevelProgress(70, 'axiom')).toBe(100);
            expect(getLevelProgress(150, 'axiom')).toBe(100);
        });

        it('should clamp progress between 0 and 100', () => {
            // Case where XP is less than current level threshold (should be 0)
            expect(getLevelProgress(5, 'spark')).toBe(0); // 5 is below spark start (10)

            // Case where XP exceeds next level threshold (should be 100)
            // Ideally calculateLevel updates the level, but purely for this function:
            expect(getLevelProgress(35, 'spark')).toBe(100); // 35 is above spark end (30)
        });
    });
});
