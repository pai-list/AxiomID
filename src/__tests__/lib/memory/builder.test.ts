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

  it('should not call mkdirSync when outputDir already exists', () => {
    mockScanProjectAST.mockReturnValue({ nodes: [], edges: [] });
    mockExtractGitInfo.mockReturnValue({ nodes: [], edges: [] });
    mockScanProjectDocs.mockReturnValue({ nodes: [], edges: [] });

    mockFs.existsSync.mockReturnValue(true);

    const outputPath = '/mock/root/memory.graph.json';
    buildAndSaveMemoryGraph(rootDir, outputPath);

    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('should produce different hash when graph content changes', () => {
    const nodes = [{ id: 'src/a.ts', type: 'file' as const }];
    const edges: any[] = [];
    const timestamp = 1718352000000;

    const hash1 = calculateGraphHash(nodes, edges, timestamp);
    const hash2 = calculateGraphHash([{ id: 'src/b.ts', type: 'file' as const }], edges, timestamp);

    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hash when timestamp changes', () => {
    const nodes = [{ id: 'src/a.ts', type: 'file' as const }];
    const edges: any[] = [];

    const hash1 = calculateGraphHash(nodes, edges, 1000);
    const hash2 = calculateGraphHash(nodes, edges, 2000);

    expect(hash1).not.toBe(hash2);
  });

  it('should produce valid hash for empty graph', () => {
    const hash = calculateGraphHash([], [], 0);
    expect(hash).toHaveLength(64);
  });

  it('should deduplicate edges and keep maximum weight', () => {
    mockScanProjectAST.mockReturnValue({
      nodes: [{ id: 'src/a.ts', type: 'file', metadata: {} }],
      edges: [{ source: 'src/a.ts', target: 'src/b.ts', type: 'imports', weight: 0.5 }]
    });

    mockExtractGitInfo.mockReturnValue({
      nodes: [],
      edges: [
        // Same edge with higher weight
        { source: 'src/a.ts', target: 'src/b.ts', type: 'imports', weight: 1.5 }
      ]
    });

    mockScanProjectDocs.mockReturnValue({ nodes: [], edges: [] });

    const graph = buildMemoryGraph(rootDir);

    const importEdges = graph.edges.filter(
      e => e.source === 'src/a.ts' && e.target === 'src/b.ts' && e.type === 'imports'
    );
    expect(importEdges).toHaveLength(1);
    expect(importEdges[0].weight).toBe(1.5);
  });

  it('should merge node hash when incoming node has hash', () => {
    mockScanProjectAST.mockReturnValue({
      nodes: [{ id: 'src/lib/did.ts', type: 'file', metadata: { size: 100 } }],
      edges: []
    });

    mockExtractGitInfo.mockReturnValue({
      nodes: [
        { id: 'src/lib/did.ts', type: 'file', metadata: { author: 'Mohamed' }, hash: 'sha256abc' }
      ],
      edges: []
    });

    mockScanProjectDocs.mockReturnValue({ nodes: [], edges: [] });

    const graph = buildMemoryGraph(rootDir);

    const didNode = graph.nodes.find(n => n.id === 'src/lib/did.ts');
    expect(didNode).toBeDefined();
    expect(didNode?.hash).toBe('sha256abc');
    expect(didNode?.metadata.size).toBe(100);
    expect(didNode?.metadata.author).toBe('Mohamed');
  });
});
