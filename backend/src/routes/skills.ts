/**
 * Skills Marketplace on Cloudflare Edge.
 * KV-cached skill catalog with install tracking.
 */

import { KVHelper } from "../db/kv";
import { D1Helper } from "../db/d1";
import type { SkillRecord } from "../lib/types";

const SKILLS_CACHE_TTL = 300; // 5 minutes

export class SkillsMarketplace {
  private kv: KVHelper;
  private d1: D1Helper;

  constructor(kv: KVHelper, d1: D1Helper) {
    this.kv = kv;
    this.d1 = d1;
  }

  /**
   * Get all skills (cached in KV).
   */
  async listSkills(): Promise<SkillRecord[]> {
    const cached = await this.kv.get<SkillRecord[]>("cache:skills:list");
    if (cached) return cached;

    // Placeholder — will fetch from D1 or external registry
    const skills: SkillRecord[] = [];

    await this.kv.set("cache:skills:list", skills, SKILLS_CACHE_TTL);
    return skills;
  }

  /**
   * Get a single skill by slug.
   */
  async getSkill(slug: string): Promise<SkillRecord | null> {
    const cached = await this.kv.get<SkillRecord>(`cache:skills:${slug}`);
    if (cached) return cached;

    // Placeholder — will fetch from D1
    return null;
  }

  /**
   * Install a skill for a user.
   */
  async installSkill(
    slug: string,
    userDid: string,
    version?: string
  ): Promise<{ success: boolean; message: string }> {
    const skill = await this.getSkill(slug);
    if (!skill) {
      return { success: false, message: "Skill not found" };
    }

    // Record install in D1
    const id = `install-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.d1.db
      .prepare(
        "INSERT OR REPLACE INTO skill_installs (id, skill_slug, user_did, version) VALUES (?, ?, ?, ?)"
      )
      .bind(id, slug, userDid, version || skill.latestVersion)
      .run();

    // Invalidate cache
    await this.kv.delete(`cache:skills:${slug}`);

    return { success: true, message: `Installed ${slug} v${version || skill.latestVersion}` };
  }

  /**
   * Get install count for a skill.
   */
  async getInstallCount(slug: string): Promise<number> {
    const result = await this.d1.db
      .prepare("SELECT COUNT(*) as count FROM skill_installs WHERE skill_slug = ?")
      .bind(slug)
      .first<{ count: number }>();
    return result?.count || 0;
  }
}
