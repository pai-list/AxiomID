import { CodeCloneResult } from './types.js';

/**
 * Code Similarity Clone Detector & Malicious Payload Analyzer
 * Inspired by Gitee CopyCat / NiCad Clone Detector algorithms.
 */
export class CodeCloneDetector {
  /**
   * Compares target code snippet against reference source code using tokenized Jaccard similarity
   */
  public analyzeCode(targetCode: string, referenceCode: string): CodeCloneResult {
    const threats: string[] = [];

    // 1. Static Security Vulnerability & Backdoor Checks
    const maliciousPatterns = [
      { pattern: /eval\s*\(/i, threat: 'Arbitrary Code Execution (eval)' },
      { pattern: /process\.env\.[A-Z0-9_]+/i, threat: 'Environment Secret Exfiltration Risk' },
      { pattern: /child_process/i, threat: 'Unsafe System Command Spawn' },
      { pattern: /http:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/i, threat: 'Hardcoded Raw IP Exfiltration' },
    ];

    for (const item of maliciousPatterns) {
      if (item.pattern.test(targetCode)) {
        threats.push(item.threat);
      }
    }

    // 2. Tokenized Structural Similarity (Jaccard Index)
    const targetTokens = new Set(this.tokenize(targetCode));
    const refTokens = new Set(this.tokenize(referenceCode));

    let intersectionCount = 0;
    for (const token of targetTokens) {
      if (refTokens.has(token)) {
        intersectionCount++;
      }
    }

    const unionCount = new Set([...targetTokens, ...refTokens]).size;
    const similarityScore = unionCount === 0 ? 0 : Number((intersectionCount / unionCount).toFixed(4));

    return {
      isFakeOrPlagiarized: similarityScore > 0.85,
      similarityScore,
      hasMaliciousPayload: threats.length > 0,
      detectedThreats: threats,
    };
  }

  private tokenize(code: string): string[] {
    return code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // strip comments
      .replace(/[^\w\s]/g, ' ') // strip punctuation
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }
}
