import productsReducer, { fetchProducts } from '../slices/products.slice';
import checkoutReducer, {
  resetCheckout,
  selectProduct,
  setCardToken,
  setCustomerEmail,
  setInstallments,
  setQuantity,
} from '../slices/checkout.slice';
import cardReducer, { clearCardMeta, setCardMeta } from '../slices/card.slice';
import transactionReducer, {
  clearTransaction,
  refreshTransaction,
  submitCheckout,
} from '../slices/transaction.slice';
import type { TransactionSummary } from '../../domain/types';

const tx: TransactionSummary = {
  id: 'tx-1',
  reference: 'PC-1-abc',
  amountInCents: 500000,
  currency: 'COP',
  status: 'APPROVED',
  productId: 'p-1',
  quantity: 1,
  customerEmail: 'a@b.co',
  createdAt: '2026-07-10T10:00:00Z',
  updatedAt: '2026-07-10T10:00:05Z',
};

describe('products slice', () => {
  it('handles the fetch lifecycle', () => {
    let state = productsReducer(undefined, { type: 'init' });
    state = productsReducer(state, fetchProducts.pending('r', undefined));
    expect(state.loading).toBe(true);

    const items = [{ id: 'p-1' }] as never;
    state = productsReducer(state, fetchProducts.fulfilled(items, 'r', undefined));
    expect(state.loading).toBe(false);
    expect(state.items).toHaveLength(1);
  });

  it('stores the rejection message', () => {
    const action = fetchProducts.rejected(null, 'r', undefined, 'sin red');
    const state = productsReducer(undefined, action);
    expect(state.error).toBe('sin red');
    expect(state.loading).toBe(false);
  });
});

describe('checkout slice', () => {
  it('selects a product resetting quantity', () => {
    let state = checkoutReducer(undefined, selectProduct('p-9'));
    state = checkoutReducer(state, setQuantity(3));
    state = checkoutReducer(state, selectProduct('p-2'));
    expect(state).toMatchObject({ productId: 'p-2', quantity: 1 });
  });

  it('clamps quantity and installments', () => {
    let state = checkoutReducer(undefined, setQuantity(-5));
    expect(state.quantity).toBe(1);
    state = checkoutReducer(state, setQuantity(2.9));
    expect(state.quantity).toBe(2);
    state = checkoutReducer(state, setInstallments(99));
    expect(state.installments).toBe(36);
    state = checkoutReducer(state, setInstallments(0));
    expect(state.installments).toBe(1);
  });

  it('trims and remembers the customer email across resets', () => {
    let state = checkoutReducer(undefined, setCustomerEmail('  a@b.co  '));
    state = checkoutReducer(state, setCardToken('tok_1'));
    state = checkoutReducer(state, resetCheckout());
    expect(state.customerEmail).toBe('a@b.co'); // asked once, kept
    expect(state.cardToken).toBeNull();
    expect(state.productId).toBeNull();
  });

  it('never holds a PAN-shaped value in its state keys', () => {
    const state = checkoutReducer(undefined, setCardToken('tok_stagtest_1'));
    expect(Object.keys(state)).toEqual([
      'productId',
      'quantity',
      'installments',
      'customerEmail',
      'cardToken',
    ]);
  });
});

describe('card slice (transient)', () => {
  it('stores and clears display metadata', () => {
    let state = cardReducer(
      undefined,
      setCardMeta({ brand: 'VISA', lastFour: '4242', holder: 'JOHN DOE' }),
    );
    expect(state.brand).toBe('VISA');
    state = cardReducer(state, clearCardMeta());
    expect(state).toEqual({ brand: 'UNKNOWN', lastFour: '', holder: '' });
  });
});

describe('transaction slice', () => {
  it('handles submit lifecycle', () => {
    const arg = {
      productId: 'p-1',
      quantity: 1,
      customerEmail: 'a@b.co',
      cardToken: 'tok_1',
      installments: 1,
    };
    let state = transactionReducer(undefined, submitCheckout.pending('r', arg));
    expect(state.submitting).toBe(true);

    state = transactionReducer(state, submitCheckout.fulfilled(tx, 'r', arg));
    expect(state.submitting).toBe(false);
    expect(state.current?.status).toBe('APPROVED');

    state = transactionReducer(state, clearTransaction());
    expect(state.current).toBeNull();
  });

  it('stores submit errors', () => {
    const arg = {
      productId: 'p-1',
      quantity: 1,
      customerEmail: 'a@b.co',
      cardToken: 'tok_1',
      installments: 1,
    };
    const state = transactionReducer(
      undefined,
      submitCheckout.rejected(null, 'r', arg, 'tarjeta rechazada'),
    );
    expect(state.error).toBe('tarjeta rechazada');
    expect(state.submitting).toBe(false);
  });

  it('refreshes the current transaction', () => {
    const updated = { ...tx, status: 'DECLINED' as const };
    const state = transactionReducer(
      { current: tx, submitting: false, error: null },
      refreshTransaction.fulfilled(updated, 'r', 'tx-1'),
    );
    expect(state.current?.status).toBe('DECLINED');
  });
});
