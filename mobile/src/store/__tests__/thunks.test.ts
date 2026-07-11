import { createStore } from '../index';
import { fetchProducts } from '../slices/products.slice';
import productsReducer from '../slices/products.slice';
import transactionReducer, {
  refreshTransaction,
  submitCheckout,
} from '../slices/transaction.slice';
import * as backend from '../../api/backend-client';

jest.mock('../../api/backend-client', () => ({
  ...jest.requireActual('../../api/backend-client'),
  getProducts: jest.fn(),
  createCheckout: jest.fn(),
  getTransaction: jest.fn(),
}));

const mocked = backend as jest.Mocked<typeof backend>;

const checkoutArg = {
  productId: 'p-1',
  quantity: 1,
  customerEmail: 'a@b.co',
  cardToken: 'tok_1',
  installments: 1,
};

describe('thunk error paths', () => {
  it('fetchProducts rejects with the Error message', async () => {
    mocked.getProducts.mockRejectedValue(new Error('backend caído'));
    const store = createStore();

    await store.dispatch(fetchProducts());

    expect(store.getState().products.error).toBe('backend caído');
  });

  it('fetchProducts falls back to a generic message on non-Error throws', async () => {
    mocked.getProducts.mockRejectedValue('boom');
    const store = createStore();

    await store.dispatch(fetchProducts());

    expect(store.getState().products.error).toBe('Error cargando productos');
  });

  it('submitCheckout stores the ApiError message', async () => {
    mocked.createCheckout.mockRejectedValue(
      new backend.ApiError('Insufficient stock', 409),
    );
    const store = createStore();

    await store.dispatch(submitCheckout(checkoutArg));

    expect(store.getState().transaction.error).toBe('Insufficient stock');
    expect(store.getState().transaction.submitting).toBe(false);
  });

  it('submitCheckout falls back to a generic message on non-Error throws', async () => {
    mocked.createCheckout.mockRejectedValue('boom');
    const store = createStore();

    await store.dispatch(submitCheckout(checkoutArg));

    expect(store.getState().transaction.error).toBe(
      'El pago no pudo procesarse',
    );
  });

  it('refreshTransaction stores errors', async () => {
    mocked.getTransaction.mockRejectedValue(new Error('sin conexión'));
    const store = createStore();

    await store.dispatch(refreshTransaction('tx-1'));

    expect(store.getState().transaction.error).toBe('sin conexión');
  });

  it('refreshTransaction falls back to a generic message on non-Error throws', async () => {
    mocked.getTransaction.mockRejectedValue(42);
    const store = createStore();

    await store.dispatch(refreshTransaction('tx-1'));

    expect(store.getState().transaction.error).toBe(
      'No se pudo consultar la transacción',
    );
  });
});

describe('rejected actions without payload use the default message', () => {
  it('products', () => {
    const state = productsReducer(undefined, {
      type: fetchProducts.rejected.type,
      payload: undefined,
      error: {},
    } as never);
    expect(state.error).toBe('Error cargando productos');
  });

  it('transaction submit', () => {
    const state = transactionReducer(undefined, {
      type: submitCheckout.rejected.type,
      payload: undefined,
      error: {},
    } as never);
    expect(state.error).toBe('El pago no pudo procesarse');
  });

  it('transaction refresh', () => {
    const state = transactionReducer(undefined, {
      type: refreshTransaction.rejected.type,
      payload: undefined,
      error: {},
    } as never);
    expect(state.error).toBe('No se pudo consultar la transacción');
  });
});
