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

    it('should validate graph with empty nodes and edges arrays', () => {
      const graph = {
        version: '1.0',
        hash: 'abc123',
        timestamp: 1000,
        nodes: [],
        edges: []
      };

      const validated = validateGraph(graph);
      expect(validated.nodes).toHaveLength(0);
      expect(validated.edges).toHaveLength(0);
    });

    it('should throw ZodError on empty hash string', () => {
      const graph = {
        version: '1.0',
        hash: '',
        timestamp: Date.now(),
        nodes: [],
        edges: []
      };

      expect(() => validateGraph(graph)).toThrow(ZodError);
    });
  });

  describe('MemoryNodeTypeSchema', () => {
    it('should accept all valid node types', () => {
      const validTypes = ['file', 'directory', 'symbol', 'doc', 'commit'];
      for (const type of validTypes) {
        expect(() => validateNode({ id: `test-${type}`, type })).not.toThrow();
      }
    });
  });

  describe('MemoryEdgeTypeSchema', () => {
    it('should accept all valid edge types', () => {
      const validTypes = ['contains', 'imports', 'exports', 'calls', 'references', 'co-occurrence', 'wikilink'];
      for (const type of validTypes) {
        expect(() => validateEdge({ source: 'a', target: 'b', type })).not.toThrow();
      }
    });
  });

  describe('validateNode additional cases', () => {
    it('should accept optional hash field on a node', () => {
      const node = {
        id: 'src/lib/auth.ts',
        type: 'file',
        hash: 'sha256hashvalue'
      };

      const validated = validateNode(node);
      expect(validated.hash).toBe('sha256hashvalue');
    });

    it('should default metadata to empty object when not provided', () => {
      const node = {
        id: 'src/lib/auth.ts',
        type: 'file'
      };

      const validated = validateNode(node);
      expect(validated.metadata).toEqual({});
    });

    it('should throw ZodError when source is empty string on edge', () => {
      const edge = {
        source: '',
        target: 'nodeB',
        type: 'imports'
      };
      expect(() => validateEdge(edge)).toThrow(ZodError);
    });

    it('should throw ZodError when target is empty string on edge', () => {
      const edge = {
        source: 'nodeA',
        target: '',
        type: 'imports'
      };
      expect(() => validateEdge(edge)).toThrow(ZodError);
    });
  });
});
