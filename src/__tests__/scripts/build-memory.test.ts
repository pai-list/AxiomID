/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/**
 * Tests for scripts/build-memory.ts
 *
 * PR change: New CLI script that orchestrates the AxiomMemory Graph Builder.
 *
 * The script:
 *   1. Determines rootDir from process.cwd()
 *   2. Constructs outputPath as path.join(rootDir, 'memory.graph.json')
 *   3. Calls buildAndSaveMemoryGraph(rootDir, outputPath)
 *   4. Logs success on completion
 *   5. Catches errors, logs them, and calls process.exit(1)
 *
 * Since main() is invoked immediately when the module is evaluated,
 * we use jest.isolateModules() to control module execution per test.
 */

import path from 'path';

// Mock the builder module before any imports
jest.mock('../../lib/memory/builder', () => ({
  buildAndSaveMemoryGraph: jest.fn(),
}));

import { buildAndSaveMemoryGraph } from '../../lib/memory/builder';
const mockBuildAndSave = buildAndSaveMemoryGraph as jest.MockedFunction<typeof buildAndSaveMemoryGraph>;

describe('build-memory CLI script', () => {
  let processExitSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('calls buildAndSaveMemoryGraph with the current working directory as rootDir', () => {
    const expectedRootDir = process.cwd();
    mockBuildAndSave.mockReturnValue({} as any);

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(mockBuildAndSave).toHaveBeenCalledTimes(1);
    expect(mockBuildAndSave.mock.calls[0][0]).toBe(expectedRootDir);
  });

  it('calls buildAndSaveMemoryGraph with memory.graph.json in the cwd as outputPath', () => {
    const expectedOutputPath = path.join(process.cwd(), 'memory.graph.json');
    mockBuildAndSave.mockReturnValue({} as any);

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(mockBuildAndSave).toHaveBeenCalledTimes(1);
    expect(mockBuildAndSave.mock.calls[0][1]).toBe(expectedOutputPath);
  });

  it('logs the start message before building', () => {
    mockBuildAndSave.mockReturnValue({} as any);

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Memory CLI] Running local AxiomMemory Graph Builder...'
    );
  });

  it('logs the success message after building completes', () => {
    mockBuildAndSave.mockReturnValue({} as any);

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Memory CLI] AxiomMemory Graph successfully built and saved!'
    );
    // process.exit should NOT be called on success
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('calls console.error and process.exit(1) when buildAndSaveMemoryGraph throws', () => {
    const buildError = new Error('Disk full — cannot write graph');
    mockBuildAndSave.mockImplementation(() => {
      throw buildError;
    });

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Memory CLI] Failed to build memory graph:',
      buildError
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('does NOT call process.exit when the build succeeds', () => {
    mockBuildAndSave.mockReturnValue({} as any);

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('does NOT log the success message when the build throws', () => {
    mockBuildAndSave.mockImplementation(() => {
      throw new Error('Build failure');
    });

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    const successLog = consoleLogSpy.mock.calls.find(
      (c) => String(c[0]).includes('successfully built')
    );
    expect(successLog).toBeUndefined();
  });

  it('calls process.exit with code 1 (not 0 or 2) on build error', () => {
    mockBuildAndSave.mockImplementation(() => {
      throw new Error('Extraction failed');
    });

    jest.isolateModules(() => {
      require('../../../scripts/build-memory');
    });

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(processExitSpy).not.toHaveBeenCalledWith(0);
  });
});
