import fs from 'fs';
import path from 'path';
import { MemoryNode, MemoryEdge } from '../graph';

const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', '.jolli', 'dist', 'out', 'build']);

/**
 * Collects all `.md` file paths in a directory tree, excluding ignored directories.
 *
 * @returns An array of full paths to `.md` files found.
 */
export function globMarkdownFiles(dir: string, rootDir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORED_DIRS.has(file)) {
        continue;
      }
      results = results.concat(globMarkdownFiles(fullPath, rootDir));
    } else {
      if (path.extname(file) === '.md') {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Extracts and parses YAML-style frontmatter from content.
 *
 * Frontmatter is expected to be delimited by `---` markers at the beginning.
 * Values are parsed as strings (with surrounding quotes removed) or arrays
 * (for values in bracket notation).
 *
 * @returns The parsed frontmatter object and the remaining body text.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const frontmatter: Record<string, any> = {};
  let body = content;

  // Match --- \n metadata \n ---
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n/);
  if (match) {
    body = content.substring(match[0].length);
    const yamlLines = match[1].split('\n');
    for (const line of yamlLines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        
        // Parse array notation [val1, val2] or string/number
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value
            .substring(1, value.length - 1)
            .split(',')
            .map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
        } else {
          frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Extracts wikilinks from markdown text, supporting `[[target]]` and `[[target|display-text]]` formats.
 *
 * @returns An array of wikilink targets.
 */
export function extractWikilinks(body: string): string[] {
  const links: string[] = [];
  // Match [[some-link]] or [[some-link|display-text]]
  const regex = /\[\[([\w\s./#\-_|]+)\]\]/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const rawLink = match[1];
    const cleanLink = rawLink.split('|')[0].trim();
    links.push(cleanLink);
  }
  return links;
}

/**
 * Resolves a wikilink target to a file path within the project.
 *
 * Attempts resolution in the following order: relative to the current document's directory (with optional `.md` extension), or as a path relative to the project root.
 *
 * @param target - The wikilink target name or path.
 * @param currentDocPath - The absolute path of the document containing the wikilink.
 * @param rootDir - The absolute path of the project root directory.
 * @returns The relative file path (normalized to forward slashes) if a matching file exists, `null` otherwise.
 */

/**
 * Parses a markdown file and creates a document node with wikilink and reference edges.
 *
 * Reads the markdown file, extracts YAML frontmatter and wikilinks, creates a document node with metadata, and produces edges for each resolved wikilink and related document entry.
 *
 * @param filePath - The absolute path to the markdown file.
 * @param rootDir - The absolute path of the project root directory.
 * @returns An object containing extracted nodes and edges. If the file cannot be processed, the returned arrays may be empty.
 */

/**
 * Scans the workspace for markdown files and aggregates extracted nodes and edges.
 *
 * Recursively discovers all markdown files, extracts metadata and links from each, and deduplicates document nodes by ID while collecting all discovered edges.
 *
 * @param rootDir - The absolute path of the project root directory to scan.
 * @returns An object containing deduplicated document nodes and all discovered edges.
 */
export function resolveWikilinkTarget(
  target: string,
  currentDocPath: string,
  rootDir: string
): string | null {
  // If target already contains extension or path, resolve relative to current doc directory
  const currentDir = path.dirname(currentDocPath);
  const potentialPath = path.resolve(currentDir, target);

  if (fs.existsSync(potentialPath) && fs.statSync(potentialPath).isFile()) {
    return path.relative(rootDir, potentialPath);
  }

  // Try matching with .md extension (for doc wikilinks without extension)
  if (!target.endsWith('.md')) {
    const mdPath = path.resolve(currentDir, `${target}.md`);
    if (fs.existsSync(mdPath) && fs.statSync(mdPath).isFile()) {
      return path.relative(rootDir, mdPath).replace(/\\/g, '/');
    }
  }

  // Try resolving as a code file relative to project root (e.g. [[src/lib/did.ts]])
  const codePath = path.join(rootDir, target);
  if (fs.existsSync(codePath) && fs.statSync(codePath).isFile()) {
    return target.replace(/\\/g, '/');
  }

  return null;
/**
 * Builds graph nodes and edges representing a markdown document's metadata and references.
 *
 * @param filePath - Path to the markdown file to process
 * @param rootDir - Root directory used to resolve relative file paths
 * @returns An object containing the extracted document node and edges for wikilinks and related references
 */
export function extractDocInfo(
  filePath: string,
  rootDir: string
): {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
} {
  const relativeFilePath = path.relative(rootDir, filePath);
  const nodes: MemoryNode[] = [];
  const edges: MemoryEdge[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const wikilinks = extractWikilinks(body);

    const docNode: MemoryNode = {
      id: relativeFilePath,
      type: 'doc',
      metadata: {
        title: frontmatter.title || path.basename(filePath, '.md'),
        tags: frontmatter.tags || [],
        description: frontmatter.description || ''
      }
    };
    nodes.push(docNode);

    // 1. Resolve wikilinks and add edges
    for (const link of wikilinks) {
      const resolved = resolveWikilinkTarget(link, filePath, rootDir);
      if (resolved) {
        edges.push({
          source: relativeFilePath,
          target: resolved,
          type: 'wikilink',
          weight: 1.0
        });
      }
    }

    // 2. Resolve YAML frontmatter "related" files/docs list
    if (Array.isArray(frontmatter.related)) {
      for (const rel of frontmatter.related) {
        const resolved = resolveWikilinkTarget(rel, filePath, rootDir);
        if (resolved) {
          edges.push({
            source: relativeFilePath,
            target: resolved,
            type: 'references',
            weight: 0.8
          });
        }
      }
    }

  } catch (err) {
    console.error(`[Doc Extractor] Error processing document ${relativeFilePath}:`, err);
  }

  return { nodes, edges };
}

/**
 * Builds an in-memory graph of project documentation by scanning markdown files and extracting their metadata and cross-references.
 *
 * @returns An object containing document nodes and the edges that represent relationships between them.
 */
export function scanProjectDocs(rootDir: string): {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
} {
  const allNodes: MemoryNode[] = [];
  const allEdges: MemoryEdge[] = [];
  const nodeMap = new Map<string, MemoryNode>();

  // Scan root directory and Amrikyy.Memory/ if it exists
  const mdFiles = globMarkdownFiles(rootDir, rootDir);

  for (const file of mdFiles) {
    const { nodes, edges } = extractDocInfo(file, rootDir);

    for (const node of nodes) {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
        allNodes.push(node);
      }
    }

    allEdges.push(...edges);
  }

  return { nodes: allNodes, edges: allEdges };
}
