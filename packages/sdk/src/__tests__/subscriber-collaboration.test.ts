import {
  WorkspaceSubscriberRegistry,
  WorkspaceEvent,
  AgentSubscriber,
} from '../subscriber-collaboration.js';

async function runSubscriberTest() {
  console.log('================================================================');
  console.log('🤝 TESTING AGENT COLLABORATION (GITEE SUBSCRIBER PATTERN)');
  console.log('================================================================\n');

  const registry = new WorkspaceSubscriberRegistry();

  // 1. Register Subagent A: Test Runner Agent
  const testAgent: AgentSubscriber = {
    agentId: 'agent-test-runner',
    agentRole: 'TestRunnerAgent',
    subscribedTopic: 'repo/code-changes',
    notify: async (event: WorkspaceEvent) => {
      console.log(`  🤖 [TestRunnerAgent]: Code mutated in ${event.payload.file}. Triggering parallel test suite...`);
      return {
        subscriberId: 'agent-test-runner',
        status: 'ACTION_TAKEN',
        actionSummary: 'Ran 20 unit tests — 100% PASS',
      };
    },
  };

  // 2. Register Subagent B: Security Auditor Agent (IQRA Policy Agent)
  const securityAgent: AgentSubscriber = {
    agentId: 'agent-iqra-security',
    agentRole: 'SecurityAuditorAgent',
    subscribedTopic: 'repo/code-changes',
    notify: async (event: WorkspaceEvent) => {
      console.log(`  🛡️ [SecurityAuditorAgent]: Auditing ${event.payload.file} against IQRA Policy...`);
      return {
        subscriberId: 'agent-iqra-security',
        status: 'ACTION_TAKEN',
        actionSummary: 'Verified zero security violations & Divine Accountability clean',
      };
    },
  };

  registry.subscribe(testAgent);
  registry.subscribe(securityAgent);

  // 3. Query Subscribers (Emulating Gitee GET /v5/repos/{owner}/{repo}/subscribers)
  console.log('📋 Querying Active Subscribers for topic "repo/code-changes"...');
  const activeSubscribers = registry.getSubscribers('repo/code-changes');
  console.log(JSON.stringify(activeSubscribers, null, 2));

  if (activeSubscribers.length !== 2) {
    throw new Error(`Expected 2 subscribers, got ${activeSubscribers.length}`);
  }

  // 4. Simulate a workspace file mutation event broadcast
  console.log('\n📡 Broadcasting "FILE_MUTATED" event from DeveloperAgent...');
  const event: WorkspaceEvent = {
    eventId: 'evt-1001',
    topic: 'repo/code-changes',
    senderAgentId: 'agent-developer-prime',
    eventType: 'FILE_MUTATED',
    payload: { file: 'packages/iqra-policy-agent/src/policy-engine.ts', linesAdded: 45 },
    timestamp: Date.now(),
  };

  const responses = await registry.broadcast(event);

  console.log('\n📬 Subscriber Agents Collaboration Responses:');
  responses.forEach((resp) => {
    console.log(`  • ${resp.subscriberId}: [${resp.status}] -> ${resp.actionSummary}`);
  });

  console.log('\n================================================================');
  console.log('✅ PASS: Gitee Subscriber Pattern successfully powers agent collaboration!');
  console.log('================================================================\n');
}

runSubscriberTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
