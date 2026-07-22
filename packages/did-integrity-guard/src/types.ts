export interface DidDocument {
  id: string;
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
  }[];
  authentication?: string[];
  created?: string;
  revoked?: boolean;
}

export interface DidValidationResult {
  valid: boolean;
  did: string;
  reason?: string;
  trustScore: number; // 0 to 100
}

export interface SybilAgentBehavior {
  agentId: string;
  requestFrequencyPerMin: number;
  distinctRecipients: number;
  payloadEntropyScore: number;
  suspiciousKeywordsCount: number;
}

export interface SybilDetectionResult {
  isScammerBot: boolean;
  riskScore: number; // 0 (Legit) to 100 (Scammer)
  flags: string[];
}

export interface CodeCloneResult {
  isFakeOrPlagiarized: boolean;
  similarityScore: number; // 0.0 to 1.0
  hasMaliciousPayload: boolean;
  detectedThreats: string[];
}
