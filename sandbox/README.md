# AxiomID Verification System Sandbox Environment

## Environment Setup

### Docker Configuration
```dockerfile
# Dockerfile.sandbox
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    python3-dev \
    postgresql-dev \
    gcc \
    g++ \
    make \
    libffi-dev \
    openssl-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set proper ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

### Docker Compose for Local Development
```yaml
# docker-compose.sandbox.yml
version: '3.8'

services:
  axiomid-app:
    build:
      context: .
      dockerfile: Dockerfile.sandbox
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/axiomid_dev
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_API_URL=http://localhost:3000
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - axiomid-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=axiomid_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sandbox/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - axiomid-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - axiomid-network

  pgadmin:
    image: dpage/pgadmin4
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@axiomid.dev
      - PGADMIN_DEFAULT_PASSWORD=password
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - axiomid-network

networks:
  axiomid-network:
    driver: bridge

volumes:
  postgres_data:
```

## Database Initialization Scripts

### Initial Schema Setup
```sql
-- sandbox/db/init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core verification tables
CREATE TABLE verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE biometric_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    template_data BYTEA NOT NULL,
    template_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE verification_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    config JSONB
);

CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES verification_sessions(id),
    agent_id UUID REFERENCES verification_agents(id),
    result_data JSONB,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_verification_sessions_user ON verification_sessions(user_id);
CREATE INDEX idx_biometric_templates_user ON biometric_templates(user_id);
CREATE INDEX idx_verification_results_session ON verification_results(session_id);
CREATE INDEX idx_verification_results_created ON verification_results(created_at);
```

## Environment Variables Configuration

### Development Environment File
```bash
# .env.sandbox
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/axiomid_dev
DIRECT_URL=postgresql://postgres:password@localhost:5432/axiomid_dev

# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Keys and Secrets
NEXTAUTH_SECRET=your-development-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Web3 Configuration
ALCHEMY_API_KEY=your-alchemy-api-key
ETHERSCAN_API_KEY=your-etherscan-api-key

# Biometric Service Configuration
BIOMETRIC_SERVICE_URL=http://localhost:3001
BIOMETRIC_API_KEY=development-biometric-key

# Feature Flags
ENABLE_SANDBOX_MODE=true
ENABLE_MOCK_VERIFICATIONS=true
ENABLE_DETAILED_LOGGING=true

# Performance Settings
CACHE_TTL_SECONDS=300
RATE_LIMIT_WINDOW_MS=60000
MAX_CONCURRENT_VERIFICATIONS=10
```

## Testing Framework Setup

### Jest Configuration for Sandbox
```javascript
// jest.sandbox.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/sandbox/test/setup.ts'],
  testMatch: ['<rootDir>/sandbox/test/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageDirectory: 'sandbox/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/sandbox/$1'
  }
};
```

### Mock Service Definitions
```typescript
// sandbox/mocks/verification-services.ts
export const mockBiometricService = {
  enroll: jest.fn().mockResolvedValue({
    success: true,
    templateId: 'mock-template-123',
    confidence: 0.95
  }),
  
  verify: jest.fn().mockResolvedValue({
    success: true,
    confidence: 0.92,
    isLive: true
  }),
  
  detectSpoofing: jest.fn().mockResolvedValue({
    isSpoof: false,
    confidence: 0.98
  })
};

export const mockBlockchainService = {
  verifyWallet: jest.fn().mockResolvedValue({
    isValid: true,
    address: '0x123...',
    balance: '1.5',
    transactionCount: 42,
    firstTransaction: '2023-01-15'
  }),
  
  analyzeTransactions: jest.fn().mockResolvedValue({
    patterns: ['regular', 'diverse'],
    riskScore: 0.1,
    reputation: 'good'
  })
};

export const mockSocialService = {
  verifyAccount: jest.fn().mockResolvedValue({
    isValid: true,
    platform: 'twitter',
    username: 'user123',
    followers: 1500,
    accountAge: 365
  }),
  
  analyzeNetwork: jest.fn().mockResolvedValue({
    connections: 150,
    authenticRelations: 85,
    suspiciousActivity: false
  })
};
```

## Sandbox Testing Scenarios

### Scenario 1: Basic Verification Flow
```typescript
// sandbox/scenarios/basic-verification.test.ts
describe('Basic Verification Flow', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await initializeMockServices();
  });

  test('should complete successful verification', async () => {
    const result = await initiateVerification({
      userId: 'test-user-1',
      verificationType: 'basic',
      biometricData: mockBiometricData,
      walletAddress: '0x123...'
    });

    expect(result.success).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.agentsInvolved).toHaveLength(3);
  });

  test('should handle verification failure gracefully', async () => {
    mockBiometricService.verify.mockResolvedValueOnce({
      success: false,
      error: 'Low confidence score'
    });

    const result = await initiateVerification({
      userId: 'test-user-2',
      verificationType: 'basic'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Low confidence');
  });
});
```

### Scenario 2: Sybil Attack Simulation
```typescript
// sandbox/scenarios/sybil-attack.test.ts
describe('Sybil Attack Detection', () => {
  test('should detect coordinated account creation', async () => {
    const attackPattern = createSybilAttackPattern({
      accountCount: 50,
      similarityThreshold: 0.95,
      timeWindow: 3600000 // 1 hour
    });

    const detections = await simulateAttackDetection(attackPattern);
    
    expect(detections.sybilClusters).toHaveLength(1);
    expect(detections.clusterSize).toBeGreaterThanOrEqual(45);
    expect(detections.confidenceScore).toBeGreaterThan(0.9);
  });

  test('should identify cross-platform correlation', async () => {
    const correlatedAccounts = createCorrelatedAccounts([
      { platform: 'twitter', username: 'user1' },
      { platform: 'github', username: 'user1-dev' },
      { platform: 'linkedin', username: 'user-one' }
    ]);

    const correlationResult = await analyzeCrossPlatformCorrelation(correlatedAccounts);
    
    expect(correlationResult.isSamePerson).toBe(true);
    expect(correlationResult.confidence).toBeGreaterThan(0.85);
  });
});
```

## Monitoring and Debugging Tools

### Custom Logger for Sandbox
```typescript
// sandbox/utils/logger.ts
import winston from 'winston';

export const sandboxLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'sandbox/logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'sandbox/logs/combined.log'
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Performance Monitoring
```typescript
// sandbox/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(label: string): string {
    const id = `${label}-${Date.now()}`;
    this.metrics.set(id, [performance.now()]);
    return id;
  }

  endTimer(id: string): number {
    const startTime = this.metrics.get(id)?.[0];
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.metrics.get(id)?.push(duration);
    return duration;
  }

  getStats(label: string): { 
    avg: number; 
    min: number; 
    max: number; 
    count: number 
  } {
    const durations = Array.from(this.metrics.values())
      .flat()
      .filter((_, i) => i % 2 === 1); // Get duration values
    
    if (durations.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
    
    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  }
}
```

## Sandbox Execution Commands

### Package.json Scripts
```json
{
  "scripts": {
    "sandbox:start": "docker-compose -f docker-compose.sandbox.yml up -d",
    "sandbox:stop": "docker-compose -f docker-compose.sandbox.yml down",
    "sandbox:test": "jest --config=jest.sandbox.config.js",
    "sandbox:test:watch": "jest --config=jest.sandbox.config.js --watch",
    "sandbox:test:coverage": "jest --config=jest.sandbox.config.js --coverage",
    "sandbox:logs": "docker-compose -f docker-compose.sandbox.yml logs -f",
    "sandbox:reset": "docker-compose -f docker-compose.sandbox.yml down -v && docker-compose -f docker-compose.sandbox.yml up -d",
    "sandbox:shell": "docker exec -it axiomid-app sh",
    "sandbox:db:shell": "docker exec -it postgres psql -U postgres -d axiomid_dev"
  }
}
```

## Security Considerations for Sandbox

### Isolated Environment Setup
```bash
#!/bin/bash
# sandbox/setup-isolation.sh

# Create isolated network
docker network create --driver bridge axiomid-sandbox-network

# Run with security constraints
docker run --security-opt=no-new-privileges \
           --read-only \
           --tmpfs /tmp \
           --cap-drop=ALL \
           --cap-add=NET_BIND_SERVICE \
           -p 3000:3000 \
           axiomid-sandbox:latest
```

### Data Sanitization
```typescript
// sandbox/utils/data-sanitizer.ts
export class DataSanitizer {
  static sanitizeUserData(userData: any): any {
    return {
      ...userData,
      // Remove sensitive information
      email: userData.email ? '[REDACTED]' : undefined,
      phone: userData.phone ? '[REDACTED]' : undefined,
      // Hash identifiers for privacy
      userId: this.hashIdentifier(userData.userId),
      sessionId: this.hashIdentifier(userData.sessionId)
    };
  }

  private static hashIdentifier(identifier: string): string {
    return crypto
      .createHash('sha256')
      .update(identifier)
      .digest('hex')
      .substring(0, 16);
  }
}
```

This sandbox environment provides a safe, isolated space for testing and validating all AxiomID verification system implementations before production deployment.