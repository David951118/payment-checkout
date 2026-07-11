import { createStore, persistConfig } from '../index';
import { fetchProducts } from '../slices/products.slice';
import { setCardToken, setCustomerEmail } from '../slices/checkout.slice';

jest.mock('../../api/backend-client', () => ({
  getProducts: jest.fn().mockResolvedValue([{ id: 'p-1', name: 'X' }]),
  createCheckout: jest.fn(),
  getTransaction: jest.fn(),
}));

describe('store', () => {
  it('persists ONLY checkout and transaction (encrypted), never products/card', () => {
    expect(persistConfig.whitelist).toEqual(['checkout', 'transaction']);
    expect(persistConfig.transforms).toHaveLength(1);
  });

  it('wires slices and thunks end to end', async () => {
    const store = createStore();
    store.dispatch(setCustomerEmail('a@b.co'));
    store.dispatch(setCardToken('tok_1'));
    await store.dispatch(fetchProducts());

    const state = store.getState();
    expect(state.checkout.customerEmail).toBe('a@b.co');
    expect(state.checkout.cardToken).toBe('tok_1');
    expect(state.products.items).toHaveLength(1);
  });
});
