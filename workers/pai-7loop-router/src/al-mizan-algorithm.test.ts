import { SevenLoopRouter } from './al-mizan-algorithm.js';

console.log('================================================================');
console.log('⚖️ TESTING AL-MIZAN MULTI-ARMED BANDIT ALGORITHM (NATIVE UNIT TEST)');
console.log('================================================================\n');

const router = new SevenLoopRouter();

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.log(`❌ [FAIL] ${msg}`);
    failed++;
  }
}

// TEST 1: Default Epsilon Greedy Selection
const route1 = router.route('Write a TypeScript function');
assert(route1.ok === true, 'Route returns OK status');
assert(!!route1.provider, `Provider selected: ${route1.provider}`);
assert(typeof route1.estimatedLatencyMs === 'number', `Latency estimated: ${route1.estimatedLatencyMs}ms`);

// TEST 2: Chinese Language Classification
const routeZH = router.route('优化 DeepSeek R1 的 TypeScript 代码');
assert(routeZH.language === 'zh', 'Chinese language correctly classified as "zh"');
assert(routeZH.provider === 'deepseek', 'DeepSeek provider selected for Chinese language task');

// TEST 3: Feedback EMA Weight Update
const beforeWeights = router.getWeights();
router.recordFeedback({
  timestamp: Date.now(),
  provider: 'deepseek',
  model: 'deepseek-chat',
  latencyMs: 400,
  costPer1M: 0.14,
  success: true,
  userRating: 5,
});

const afterWeights = router.getWeights();
assert(
  afterWeights['deepseek:deepseek-chat'] > 0.5,
  `DeepSeek weight increased after 5-star rating (Weight: ${afterWeights['deepseek:deepseek-chat'].toFixed(4)})`
);

console.log('\n================================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
