import { validateNode, validateEdge, validateGraph, MemoryNodeTypeSchema, MemoryEdgeTypeSchema } from '../../../lib/memory/graph';
import { ZodError } from 'zod';

describe('AxiomMemory Graph Schema', () => {
  describe('validateNode', () => {
    it('should validate a correct node', () => {
      const node = {
        id: 'src/lib/memory/graph.ts',
        type: 'file',
        metadata: {
          hash: 'abc123hash',
          author: 'Mohamed Abdelaziz'
        }
      };

      const validated = validateNode(node);
      expect(validated.id).toBe(node.id);
      expect(validated.type).toBe('file');
      expect(validated.metadata).toEqual(node.metadata);
    });

    it('should throw ZodError on invalid node type', () => {
      const node = {
        id: 'invalid-type-node',
        type: 'non-existent-type'
      };

      expect(() => validateNode(node)).toThrow(ZodError);
    });

    it('should throw ZodError on empty ID', () => {
      const node = {
        id: '',
        type: 'directory'
      };

      expect(() => validateNode(node)).toThrow(ZodError);
    });
  });

  describe('validateEdge', () => {
    it('should validate a correct edge', () => {
      const edge = {
        source: 'src/lib/memory/graph.ts',
        target: 'src/lib/memory/router.ts',
        type: 'imports',
        weight: 1.5
      };

      const validated = validateEdge(edge);
      expect(validated.source).toBe(edge.source);
      expect(validated.target).toBe(edge.target);
      expect(validated.type).toBe('imports');
      expect(validated.weight).toBe(1.5);
    });

    it('should use default weight of 1.0 if not provided', () => {
      const edge = {
        source: 'nodeA',
        target: 'nodeB',
        type: 'contains'
      };

      const validated = validateEdge(edge);
      expect(validated.weight).toBe(1.0);
    });

    it('should throw ZodError on invalid edge type', () => {
      const edge = {
        source: 'nodeA',
        target: 'nodeB',
        type: 'likes'
      };

      expect(() => validateEdge(edge)).toThrow(ZodError);
    });
  });

  describe('validateGraph', () => {
    it('should validate a complete and correct graph', () => {
      const graph = {
        version: '1.0',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // sha256 empty hash
        timestamp: Date.now(),
        nodes: [
          { id: 'src', type: 'directory' },
          { id: 'src/index.ts', type: 'file' }
        ],
        edges: [
          { source: 'src', target: 'src/index.ts', type: 'contains' }
        ]
      };

      const validated = validateGraph(graph);
      expect(validated.version).toBe('1.0');
      expect(validated.nodes).toHaveLength(2);
      expect(validated.edges).toHaveLength(1);
    });

    it('should throw ZodError on missing verification hash', () => {
      const graph = {
        version: '1.0',
        timestamp: Date.now(),
        nodes: [],
        edges: []
      };

      expect(() => validateGraph(graph)).toThrow(ZodError);
    });
  });
});
