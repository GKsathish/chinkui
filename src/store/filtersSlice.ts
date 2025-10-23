import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Filters } from './filtersModel';

const initialState: Filters = {
  tables: 'Slots'
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    filtersUpdated(state, action: PayloadAction<Filters>) {
      state.tables = action.payload.tables
    },
    tablesFilterUpdated(state, action: PayloadAction<Filters['tables']>) {
      state.tables = action.payload;
    },
  },
});

export const { tablesFilterUpdated, filtersUpdated } = filtersSlice.actions;
export default filtersSlice.reducer;
