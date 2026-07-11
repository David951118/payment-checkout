import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  CheckoutRequest,
  createCheckout,
  getTransaction,
} from '../../api/backend-client';
import type { TransactionSummary } from '../../domain/types';

/**
 * PERSISTED (AES-encrypted): the transaction state survives app restarts so
 * an interrupted payment can be resumed/checked (resilience requirement).
 */
export interface TransactionState {
  current: TransactionSummary | null;
  submitting: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  current: null,
  submitting: false,
  error: null,
};

export const submitCheckout = createAsyncThunk(
  'transaction/submit',
  async (payload: CheckoutRequest, { rejectWithValue }) => {
    try {
      return await createCheckout(payload);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'El pago no pudo procesarse',
      );
    }
  },
);

export const refreshTransaction = createAsyncThunk(
  'transaction/refresh',
  async (id: string, { rejectWithValue }) => {
    try {
      return await getTransaction(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'No se pudo consultar la transacción',
      );
    }
  },
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearTransaction() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(submitCheckout.pending, state => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitCheckout.fulfilled, (state, action) => {
        state.submitting = false;
        state.current = action.payload;
      })
      .addCase(submitCheckout.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) ?? 'El pago no pudo procesarse';
      })
      .addCase(refreshTransaction.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(refreshTransaction.rejected, (state, action) => {
        state.error =
          (action.payload as string) ?? 'No se pudo consultar la transacción';
      });
  },
});

export const { clearTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
