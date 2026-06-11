export const PiSdkBase = jest.fn().mockImplementation(() => ({
  connect: jest.fn(),
  createPayment: jest.fn(),
}));
