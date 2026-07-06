const mockFn = () => jest.fn().mockReturnThis();

export const forceSimulation = jest.fn().mockReturnValue({
  force: mockFn,
  on: mockFn,
  alpha: mockFn,
  tick: jest.fn(),
  stop: jest.fn(),
  nodes: jest.fn().mockReturnValue([]),
});
export const forceLink = jest.fn().mockReturnValue({
  id: mockFn,
  distance: mockFn,
});
export const forceManyBody = jest.fn().mockReturnValue({
  strength: mockFn,
});
export const forceCenter = jest.fn().mockReturnValue({});
export const forceCollide = jest.fn().mockReturnValue({
  radius: mockFn,
});
