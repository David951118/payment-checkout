import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CardBrand } from '../../domain/types';

/**
 * TRANSIENT (never persisted — blacklisted in the store config).
 * Display-only card metadata; the PAN/CVC themselves live only in the form
 * inputs and are discarded right after tokenization.
 */
export interface CardState {
  brand: CardBrand;
  lastFour: string;
  holder: string;
}

const initialState: CardState = {
  brand: 'UNKNOWN',
  lastFour: '',
  holder: '',
};

const cardSlice = createSlice({
  name: 'card',
  initialState,
  reducers: {
    setCardMeta(state, action: PayloadAction<CardState>) {
      state.brand = action.payload.brand;
      state.lastFour = action.payload.lastFour;
      state.holder = action.payload.holder;
    },
    clearCardMeta() {
      return initialState;
    },
  },
});

export const { setCardMeta, clearCardMeta } = cardSlice.actions;
export default cardSlice.reducer;
