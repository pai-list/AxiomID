/* eslint-disable @typescript-eslint/no-explicit-any */
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
export const select = jest.fn().mockReturnValue({
  selectAll: jest.fn().mockReturnValue({
    data: jest.fn().mockReturnValue({
      join: jest.fn().mockReturnValue({
        attr: mockFn,
        style: mockFn,
        on: mockFn,
      }),
    }),
  }),
  append: jest.fn().mockReturnValue({
    attr: mockFn,
    style: mockFn,
    text: mockFn,
  }),
  remove: jest.fn(),
});
export const scaleOrdinal = jest.fn().mockReturnValue(jest.fn());
export const drag = jest.fn().mockReturnValue({
  on: mockFn,
});
