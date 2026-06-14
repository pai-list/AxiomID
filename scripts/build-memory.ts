import path from 'path';
import { buildAndSaveMemoryGraph } from '../src/lib/memory/builder';

function main() {
  try {
    const rootDir = process.cwd();
    const outputPath = path.join(rootDir, 'memory.graph.json');
    
    console.log('[Memory CLI] Running local AxiomMemory Graph Builder...');
    buildAndSaveMemoryGraph(rootDir, outputPath);
    console.log('[Memory CLI] AxiomMemory Graph successfully built and saved!');
  } catch (error) {
    console.error('[Memory CLI] Failed to build memory graph:', error);
    process.exit(1);
  }
}

main();
