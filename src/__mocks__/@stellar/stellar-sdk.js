const Keypair = {
  fromSecret: jest.fn(),
  fromPublicKey: jest.fn(),
};
const TransactionBuilder = jest.fn();
const Memo = {
  text: jest.fn(),
};
const Horizon = {
  Server: jest.fn(() => ({
    serverURL: { toString: () => "https://horizon-testnet.stellar.org" },
    transactions: () => ({
      transaction: () => ({
        call: jest.fn().mockRejectedValue({ response: { status: 404 } })
      })
    })
  })),
};
const Networks = {
  TESTNET: "testnet",
  PUBLIC: "public"
};

module.exports = {
  Keypair,
  TransactionBuilder,
  Memo,
  Horizon,
  Networks
};
