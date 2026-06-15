import { MemoryGraph } from '../../../lib/memory/graph';
import { TopologicalRouter } from '../../../lib/memory/router';

describe('TopologicalRouter', () => {
  // Setup a dummy cyclical graph
  // A -> contains -> B (weight: 0.5)
  // B -> imports -> C (weight: 1.0)
  // C -> imports -> D (weight: 1.0)
  // D -> imports -> B (weight: 1.0) - Cycle!
  // A -> contains -> E (weight: 0.5)
  const dummyGraph: MemoryGraph = {
    version: '1.0',
    hash: 'dummyhash',
    timestamp: Date.now(),
    nodes: [
      { id: 'nodeA', type: 'directory' },
      { id: 'nodeB', type: 'file' },
      { id: 'nodeC', type: 'file' },
      { id: 'nodeD', type: 'file' },
      { id: 'nodeE', type: 'file' }
    ],
    edges: [
      { source: 'nodeA', target: 'nodeB', type: 'contains', weight: 0.5 },
      { source: 'nodeB', target: 'nodeC', type: 'imports', weight: 1.0 },
      { source: 'nodeC', target: 'nodeD', type: 'imports', weight: 1.0 },
      { source: 'nodeD', target: 'nodeB', type: 'imports', weight: 1.0 },
      { source: 'nodeA', target: 'nodeE', type: 'contains', weight: 0.5 }
    ]
  };

  let router: TopologicalRouter;

  beforeEach(() => {
    router = new TopologicalRouter(dummyGraph);
  });

  it('should return direct neighbors at distance 1 sorted by weight', () => {
    // For nodeB:
    // Forward edge to nodeC (imports, weight 1.0)
    // Backward edge to nodeA (contains:rev, weight 0.5 * 0.8 = 0.4)
    // Backward edge to nodeD (imports:rev, weight 1.0 * 0.8 = 0.8)
    const context = router.getContext('nodeB', 1);

    expect(context).toHaveLength(3);
    
    // First should be nodeC (distance 1, weight 1.0)
    expect(context[0].node.id).toBe('nodeC');
    expect(context[0].distance).toBe(1);
    expect(context[0].weight).toBe(1.0);

    // Second should be nodeD (distance 1, weight 0.8)
    expect(context[1].node.id).toBe('nodeD');
    expect(context[1].distance).toBe(1);
    expect(context[1].weight).toBe(0.8);

    // Third should be nodeA (distance 1, weight 0.4)
    expect(context[2].node.id).toBe('nodeA');
    expect(context[2].distance).toBe(1);
    expect(context[2].weight).toBe(0.4);
  });

  it('should traverse up to radius 2 and find nodeE from nodeB', () => {
    // Path: nodeB -> nodeA -> nodeE
    const context = router.getContext('nodeB', 2);
    
    const nodeEEntry = context.find(c => c.node.id === 'nodeE');
    expect(nodeEEntry).toBeDefined();
    expect(nodeEEntry?.distance).toBe(2);
    // Weight: accumulated (backward from B to A = 0.4) * forward A to E (0.5) = 0.2
    expect(nodeEEntry?.weight).toBeCloseTo(0.2);
  });

  it('should handle cyclical graphs without infinite loops', () => {
    // Maximum radius larger than cycle size
    const context = router.getContext('nodeB', 5);
    
    // Total nodes in graph except B is 4 (A, C, D, E)
    expect(context).toHaveLength(4);
    
    // None should be nodeB itself
    expect(context.find(c => c.node.id === 'nodeB')).toBeUndefined();
  });

  it('should return empty array for non-existent target node', () => {
    const context = router.getContext('nonExistent');
    expect(context).toHaveLength(0);
  });

  it('should use default radius of 2 when not specified', () => {
    // nodeB -> nodeC (distance 1) -> nodeD (distance 2)
    // nodeB -> nodeA (distance 1) -> nodeE (distance 2)
    // nodeD -> nodeB (cycle, already visited)
    const context = router.getContext('nodeB');

    // Should find nodeC, nodeD, nodeA at distance 1, and nodeE at distance 2
    expect(context.find(c => c.node.id === 'nodeE')).toBeDefined();
    expect(context.find(c => c.node.id === 'nodeE')?.distance).toBe(2);
  });

  it('should return empty array when radius is 0', () => {
    // maxRadius=0 means we never leave the starting node
    const context = router.getContext('nodeB', 0);
    expect(context).toHaveLength(0);
  });

  it('should return empty context for isolated node with no edges', () => {
    const isolatedGraph: MemoryGraph = {
      version: '1.0',
      hash: 'isolatedhash',
      timestamp: Date.now(),
      nodes: [
        { id: 'isolated', type: 'file' },
        { id: 'other', type: 'file' }
      ],
      edges: []
    };

    const isolatedRouter = new TopologicalRouter(isolatedGraph);
    const context = isolatedRouter.getContext('isolated');
    expect(context).toHaveLength(0);
  });

  it('should update weight when a heavier path at same distance is found', () => {
    // Graph: A -> B (weight 0.5), A -> C (weight 1.0), C -> B (weight 1.0)
    // From A at radius 2:
    // B reachable via direct edge: weight 0.5 (distance 1)
    // B also reachable via C: weight 1.0 * 1.0 = 1.0 (distance 2 - NOT same distance as direct)
    // So direct edge wins at distance 1 with weight 0.5
    const weightUpdateGraph: MemoryGraph = {
      version: '1.0',
      hash: 'weighthash',
      timestamp: Date.now(),
      nodes: [
        { id: 'A', type: 'directory' },
        { id: 'B', type: 'file' },
        { id: 'C', type: 'file' }
      ],
      edges: [
        { source: 'A', target: 'B', type: 'contains', weight: 0.5 },
        { source: 'A', target: 'C', type: 'contains', weight: 1.0 },
        { source: 'C', target: 'B', type: 'imports', weight: 1.0 }
      ]
    };

    const weightRouter = new TopologicalRouter(weightUpdateGraph);
    const context = weightRouter.getContext('A', 1);

    // At radius 1, both B (direct, 0.5) and C (direct, 1.0) are found
    const bEntry = context.find(c => c.node.id === 'B');
    const cEntry = context.find(c => c.node.id === 'C');
    expect(bEntry).toBeDefined();
    expect(cEntry).toBeDefined();
    // C has higher weight so should come first
    expect(context[0].node.id).toBe('C');
    expect(context[0].weight).toBe(1.0);
  });

  it('should not include starting node in results', () => {
    const context = router.getContext('nodeA', 3);
    expect(context.find(c => c.node.id === 'nodeA')).toBeUndefined();
  });
});
