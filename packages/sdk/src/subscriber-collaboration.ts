/**
 * Agentic Workspace Subscriber & Collaboration System
 * Modeled after Gitee Repo Subscribers Pattern (GET /v5/repos/{owner}/{repo}/subscribers)
 */

export interface AgentSubscriber {
  agentId: string;
  agentRole: string;
  subscribedTopic: string;
  notify: (event: WorkspaceEvent) => Promise<WorkspaceEventResponse>;
}

export interface WorkspaceEvent {
  eventId: string;
  topic: string;
  senderAgentId: string;
  eventType: 'FILE_MUTATED' | 'POLICY_DENIED' | 'WEIGHTS_UPDATED' | 'TASK_COMPLETED';
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface WorkspaceEventResponse {
  subscriberId: string;
  status: 'PROCESSED' | 'IGNORED' | 'ACTION_TAKEN';
  actionSummary?: string;
}

/**
 * Agentic Subscriber Collaboration Registry
 */
export class WorkspaceSubscriberRegistry {
  private subscribersMap: Map<string, AgentSubscriber[]> = new Map();

  /**
   * Subscribe an agent to a workspace topic (Gitee Subscriber Pattern)
   */
  public subscribe(subscriber: AgentSubscriber): void {
    const existing = this.subscribersMap.get(subscriber.subscribedTopic) || [];
    existing.push(subscriber);
    this.subscribersMap.set(subscriber.subscribedTopic, existing);
  }

  /**
   * Unsubscribe an agent from a topic
   */
  public unsubscribe(topic: string, agentId: string): void {
    const existing = this.subscribersMap.get(topic) || [];
    this.subscribersMap.set(
      topic,
      existing.filter((s) => s.agentId !== agentId)
    );
  }

  /**
   * Get all subscriber agents for a specific topic (Gitee Subscribers Endpoint)
   */
  public getSubscribers(topic: string): Omit<AgentSubscriber, 'notify'>[] {
    const list = this.subscribersMap.get(topic) || [];
    return list.map(({ agentId, agentRole, subscribedTopic }) => ({
      agentId,
      agentRole,
      subscribedTopic,
    }));
  }

  /**
   * Broadcast an event to all subscribed agents to trigger autonomous collaboration
   */
  public async broadcast(event: WorkspaceEvent): Promise<WorkspaceEventResponse[]> {
    const subscribers = this.subscribersMap.get(event.topic) || [];
    const wildcardSubscribers = this.subscribersMap.get('*') || [];

    const allSubscribers = [...subscribers, ...wildcardSubscribers];

    const responses = await Promise.all(
      allSubscribers.map(async (sub) => {
        try {
          return await sub.notify(event);
        } catch (err: any) {
          return {
            subscriberId: sub.agentId,
            status: 'IGNORED' as const,
            actionSummary: `Error: ${err.message}`,
          };
        }
      })
    );

    return responses;
  }
}
