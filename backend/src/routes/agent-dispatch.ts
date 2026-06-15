/**
 * Agent Dispatch — routes skill actions to the right executor.
 * POST /api/agent/dispatch
 */

import type { Env } from "../lib/types";
import { KVHelper } from "../db/kv";
import { D1Helper } from "../db/d1";

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

  constructor(kv: KVHelper, d1: D1Helper) {
    this.kv = kv;
    this.d1 = d1;
  }

  /**
   * Dispatch a skill action.
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const startTime = Date.now();

    // Verify skill is installed
    const installed = await this.d1.db
      .prepare(
        "SELECT * FROM skill_installs WHERE skill_slug = ? AND user_did = ?"
      )
      .bind(request.skillSlug, request.userDid)
      .first();

    if (!installed) {
      throw new Error("Skill not installed");
    }

    // Route to skill executor
    const result = await this.executeSkillAction(
      request.skillSlug,
      request.action,
      request.params
    );

    return {
      skillSlug: request.skillSlug,
      action: request.action,
      result,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Execute a skill action.
   * This is the plugin execution engine.
   */
  private async executeSkillAction(
    slug: string,
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    // Plugin registry — maps skill slugs to executors
    const executors: Record<string, (action: string, params: Record<string, unknown>) => Promise<unknown>> = {
      "harvest-search": this.executeHarvestSearch.bind(this),
      "trust-verify": this.executeTrustVerify.bind(this),
      "did-resolve": this.executeDidResolve.bind(this),
    };

    const executor = executors[slug];
    if (!executor) {
      throw new Error(`No executor for skill: ${slug}`);
    }

    return executor(action, params);
  }

  private async executeHarvestSearch(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "query") {
      return { query: params.query, status: "dispatched" };
    }
    throw new Error(`Unknown action: ${action}`);
  }

  private async executeTrustVerify(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "score") {
      return { did: params.did, score: 0.5, status: "computed" };
    }
    throw new Error(`Unknown action: ${action}`);
  }

  private async executeDidResolve(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (action === "resolve") {
      return { did: params.did, resolved: true, status: "resolved" };
    }
    throw new Error(`Unknown action: ${action}`);
  }
}
