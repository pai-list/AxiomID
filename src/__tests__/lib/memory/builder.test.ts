import fs from 'fs';
import path from 'path';
import { buildMemoryGraph, calculateGraphHash, buildAndSaveMemoryGraph } from '../../../lib/memory/builder';
import { scanProjectAST } from '../../../lib/memory/extractors/ast-extractor';
import { extractGitInfo } from '../../../lib/memory/extractors/git-extractor';
import { scanProjectDocs } from '../../../lib/memory/extractors/doc-extractor';

jest.mock('fs', () => {
  const original = jest.requireActual('fs');
  return {
    ...original,
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn()
  };
});

jest.mock('../../../lib/memory/extractors/ast-extractor');
jest.mock('../../../lib/memory/extractors/git-extractor');
jest.mock('../../../lib/memory/extractors/doc-extractor');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockScanProjectAST = scanProjectAST as jest.MockedFunction<typeof scanProjectAST>;
const mockExtractGitInfo = extractGitInfo as jest.MockedFunction<typeof extractGitInfo>;
const mockScanProjectDocs = scanProjectDocs as jest.MockedFunction<typeof scanProjectDocs>;

describe('MemoryBuilder', () => {
  const rootDir = '/mock/root';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compute deterministic hashes for identical graphs', () => {
    const nodes = [
      { id: 'fileB.ts', type: 'file' as const },
      { id: 'fileA.ts', type: 'file' as const }
    ];
    const edges = [
      { source: 'fileB.ts', target: 'fileA.ts', type: 'imports' as const }
    ];
    const timestamp = 1718352000000;

    // Hash with files in one order
    const hash1 = calculateGraphHash(nodes, edges, timestamp);

    // Hash with files in different order
    const hash2 = calculateGraphHash([nodes[1], nodes[0]], edges, timestamp);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // sha256 length
  });

  it('should aggregate, merge and validate the topological graph', () => {
    // Mock extractors
    mockScanProjectAST.mockReturnValue({
      nodes: [
        { id: 'src/lib/did.ts', type: 'file', metadata: { size: 100 } }
      ],
      edges: []
    });

    mockExtractGitInfo.mockReturnValue({
      nodes: [
        { id: 'commit:123', type: 'commit', metadata: { author: 'Mohamed' } }
      ],
      edges: [
        { source: 'commit:123', target: 'src/lib/did.ts', type: 'references', weight: 1.0 }
      ]
    });

    mockScanProjectDocs.mockReturnValue({
      nodes: [
        { id: 'docs/spec.md', type: 'doc', metadata: { title: 'Spec' } },
        // Duplicate node from AST to test merging
        { id: 'src/lib/did.ts', type: 'file', metadata: { description: 'DID implementation' } }
      ],
      edges: [
        { source: 'docs/spec.md', target: 'src/lib/did.ts', type: 'wikilink', weight: 1.0 }
      ]
    });

    const graph = buildMemoryGraph(rootDir);

    expect(graph.version).toBe('1.0');
    expect(graph.hash).toHaveLength(64);
    
    // Total nodes: src/lib/did.ts, commit:123, docs/spec.md
    expect(graph.nodes).toHaveLength(3);
    
    // Check did.ts node was merged
    const didNode = graph.nodes.find(n => n.id === 'src/lib/did.ts');
    expect(didNode).toBeDefined();
    expect(didNode?.metadata.size).toBe(100);
    expect(didNode?.metadata.description).toBe('DID implementation');

    // Total edges: commit:123->did.ts, docs/spec.md->did.ts
    expect(graph.edges).toHaveLength(2);
  });

  it('should save the generated graph to disk', () => {
    mockScanProjectAST.mockReturnValue({ nodes: [], edges: [] });
    mockExtractGitInfo.mockReturnValue({ nodes: [], edges: [] });
    mockScanProjectDocs.mockReturnValue({ nodes: [], edges: [] });
    
    mockFs.existsSync.mockReturnValue(false);

    const outputPath = '/mock/root/memory.graph.json';
    buildAndSaveMemoryGraph(rootDir, outputPath);

    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/root', { recursive: true });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('"version": "1.0"'),
      'utf-8'
    );
  });
});
