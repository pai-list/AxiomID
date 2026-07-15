/**
 * Agent Dispatch — routes skill actions to real service executors.
 * POST /api/agent/dispatch
 */

import type { Env } from "../lib/types";
import { KVHelper } from "../db/kv";
import { D1Helper } from "../db/d1";
import { TrustEngine } from "../lib/trust";
import { DelegationResolver } from "../lib/delegation";
import { PerplexityClient } from "../lib/perplexity-client";
import { generateId } from "../lib/utils";

export interface DispatchRequest {
  skillSlug: string;
  action: string;
  params: Record<string, unknown>;
  userDid: string;
}

export interface DispatchResult {
  skillSlug: string;
  action: string;
  result: unknown;
  executionTimeMs: number;
}

export class AgentDispatcher {
  private kv: KVHelper;
  private d1: D1Helper;
  private trust: TrustEngine;
  private delegation: DelegationResolver;
  private env: Env;

  constructor(kv: KVHelper, d1: D1Helper, env?: Env) {
    this.kv = kv;
    this.d1 = d1;
    this.trust = new TrustEngine(kv);
    this.delegation = new DelegationResolver(d1);
    this.env = env!;
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const startTime = Date.now();

    // Verify skill is installed
    const installed = await this.d1.db
      .prepare("SELECT * FROM skill_installs WHERE skill_slug = ? AND user_did = ?")
      .bind(request.skillSlug, request.userDid)
      .first();

    if (!installed) {
      throw new Error("Skill not installed");
    }

    const result = await this.executeSkillAction(request.skillSlug, request.action, request.params, request.userDid);

    return {
      skillSlug: request.skillSlug,
      action: request.action,
      result,
      executionTimeMs: Date.now() - startTime,
    };
  }

  private async executeSkillAction(
    slug: string,
    action: string,
    params: Record<string, unknown>,
    callerDid: string
  ): Promise<unknown> {
    const executors: Record<string, (action: string, params: Record<string, unknown>, callerDid: string) => Promise<unknown>> = {
      "harvest-search": (act, prm) => this.executeHarvestSearch(act, prm),
      "trust-verify": (act, prm, caller) => this.executeTrustVerify(act, prm, caller),
      "did-resolve": (act, prm) => this.executeDidResolve(act, prm),
      "presence-monitor": (act, prm) => this.executePresenceMonitor(act, prm),
      "identity-builder": (act, prm) => this.executeIdentityBuilder(act, prm),
    };

    const executor = executors[slug];
    if (!executor) {
      throw new Error(`No executor for skill: ${slug}`);
    }

    return executor(action, params, callerDid);
  }

  private async executeHarvestSearch(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "query") {
      const query = params.query as string;
      if (!query) throw new Error("Missing query parameter");

      // Enqueue harvest job
      const jobId = generateId("h");
      await this.env.HARVEST_QUEUE.send({
        jobId,
        query,
        userDid: params.userDid as string,
      });

      return { jobId, query, status: "queued", timestamp: Date.now() };
    }

    if (action === "result") {
      const jobId = params.jobId as string;
      if (!jobId) throw new Error("Missing jobId parameter");
      const result = await this.d1.getHarvestResult(jobId);
      return result || { error: "Not found" };
    }

    throw new Error(`Unknown harvest action: ${action}`);
  }

  private async executeTrustVerify(
    action: string,
    params: Record<string, unknown>,
    callerDid: string
  ): Promise<unknown> {
    if (!callerDid) {
      throw new Error("Unauthorized: callerDid must be provided for trust verification.");
    }
    if (action === "score") {
      const did = params.did as string;
      if (!did) throw new Error("Missing did parameter");
      return await this.trust.compute(did);
    }

    if (action === "delegate") {
      const { delegatorDid, delegateeDid, trustLevel } = params;
      if (!delegatorDid || !delegateeDid || trustLevel === undefined) {
        throw new Error("Missing delegatorDid, delegateeDid, or trustLevel");
      }
      await this.delegation.addDelegation(
        delegatorDid as string,
        delegateeDid as string,
        trustLevel as number
      );
      return { success: true, delegatorDid, delegateeDid, trustLevel };
    }

    if (action === "chain") {
      const { sourceDid, targetDid } = params;
      if (!sourceDid || !targetDid) throw new Error("Missing sourceDid or targetDid");
      const chain = await this.delegation.resolveChain(sourceDid as string, targetDid as string, callerDid);
      const delegatedTrust = await this.delegation.computeDelegatedTrust(sourceDid as string, targetDid as string, callerDid);
      return { chain, delegatedTrust, hops: chain.length };
    }

    throw new Error(`Unknown trust action: ${action}`);
  }

  private async executeDidResolve(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "resolve") {
      const did = params.did as string;
      if (!did) throw new Error("Missing did parameter");

      // Check harvest_results for activity
      const activity = await this.d1.db
        .prepare("SELECT * FROM harvest_results WHERE user_did = ? LIMIT 1")
        .bind(did)
        .first();

      // Check trust score
      const trustScore = await this.trust.compute(did);

      return {
        did,
        resolved: true,
        hasActivity: !!activity,
        trustScore: trustScore.score,
        timestamp: Date.now(),
      };
    }

    if (action === "create") {
      const piUsername = params.piUsername as string;
      if (!piUsername) throw new Error("Missing piUsername parameter");
      const did = `did:pi:${piUsername}:${Date.now().toString(36)}`;
      return { did, piUsername, created: new Date().toISOString() };
    }

    throw new Error(`Unknown did action: ${action}`);
  }

  private async executePresenceMonitor(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "heartbeat") {
      const agentId = params.agentId as string;
      if (!agentId) throw new Error("Missing agentId parameter");
      await this.d1.updatePresence(agentId, "online", params.metadata as Record<string, unknown>);
      return { agentId, status: "online", timestamp: Date.now() };
    }

    if (action === "status") {
      const agentId = params.agentId as string;
      if (!agentId) throw new Error("Missing agentId parameter");
      const presence = await this.d1.getPresence(agentId);
      return {
        agentId,
        status: presence?.status || "offline",
        lastHeartbeat: presence?.last_heartbeat || null,
        metadata: presence?.metadata ? JSON.parse(presence.metadata) : null,
      };
    }

    throw new Error(`Unknown presence action: ${action}`);
  }

  private async executeIdentityBuilder(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "create") {
      const piUsername = params.piUsername as string;
      if (!piUsername) throw new Error("Missing piUsername parameter");
      const did = `did:pi:${piUsername}:${Date.now().toString(36)}`;
      return { did, piUsername, trustScore: 0.1, created: new Date().toISOString() };
    }

    if (action === "status") {
      const did = params.did as string;
      if (!did) throw new Error("Missing did parameter");
      const trustScore = await this.trust.compute(did);
      const presence = await this.d1.getPresence(did);
      return { did, trustScore: trustScore.score, presence: presence?.status || "offline" };
    }

    throw new Error(`Unknown identity action: ${action}`);
  }
}
