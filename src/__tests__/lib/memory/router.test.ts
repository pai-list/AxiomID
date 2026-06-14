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
});
