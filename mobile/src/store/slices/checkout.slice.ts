import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * PERSISTED (AES-encrypted). Holds only PCI-safe data: the gateway card
 * token, purchase intent and the customer email (asked once, then reused).
 * The PAN/CVC/expiry NEVER enter this slice — see card.slice.ts (transient).
 */
export interface CheckoutState {
  productId: string | null;
  quantity: number;
  installments: number;
  customerEmail: string;
  cardToken: string | null;
}

const initialState: CheckoutState = {
  productId: null,
  quantity: 1,
  installments: 1,
  customerEmail: '',
  cardToken: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<string>) {
      state.productId = action.payload;
      state.quantity = 1;
    },
    setQuantity(state, action: PayloadAction<number>) {
      state.quantity = Math.max(1, Math.trunc(action.payload));
    },
    setInstallments(state, action: PayloadAction<number>) {
      state.installments = Math.min(36, Math.max(1, action.payload));
    },
    setCustomerEmail(state, action: PayloadAction<string>) {
      state.customerEmail = action.payload.trim();
    },
    setCardToken(state, action: PayloadAction<string>) {
      state.cardToken = action.payload;
    },
    /** Clears purchase intent but keeps the remembered email. */
    resetCheckout(state) {
      state.productId = null;
      state.quantity = 1;
      state.installments = 1;
      state.cardToken = null;
    },
  },
});

export const {
  selectProduct,
  setQuantity,
  setInstallments,
  setCustomerEmail,
  setCardToken,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
