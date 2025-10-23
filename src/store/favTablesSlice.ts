import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState: string[] = [];

const favTablesSlice = createSlice({
  name: 'favTables',
  initialState,
  reducers: {
    favTableAdded(state, action: PayloadAction<string>) {
      state.push(action.payload);
    },
    favTablesLoaded(state, action: PayloadAction<string[]>) {
      return action.payload;
    },
  },
});

export const { favTableAdded, favTablesLoaded } = favTablesSlice.actions;
export default favTablesSlice.reducer;
