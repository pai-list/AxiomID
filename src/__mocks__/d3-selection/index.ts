/* eslint-disable @typescript-eslint/no-explicit-any */
const mockFn = () => jest.fn().mockReturnThis();

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
