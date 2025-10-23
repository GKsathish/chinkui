// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Filters } from './filtersModel';
// import { Table } from './tablesModel';

// const initialState: Table[] = [];

// const tablesSlice = createSlice({
//   name: 'tables',
//   initialState,
//   reducers: {
//     tableAdded(state, action: PayloadAction<Table>) {
//       state.push(action.payload);
//     },
//     tablesLoaded(state, action: PayloadAction<Table[]>) {
//       return action.payload;
//     },
//   },
//   selectors: {
//     tablesFiltered: (tablesState, filters: Filters, favTables?: string[], excludeTableId?: string) => {
//       let tables = tablesState;
//       if (filters.tables) {
//         switch(filters.tables) {
//           case 'Fun': tables = tablesState.filter(_t => _t.category === 'fun'); break;
//           case 'Favourite': tables = tablesState.filter(_t => favTables?.includes(_t.tableId)); break;
//           case 'Slots': tables = tablesState.filter(_t => _t.category === 'slot'); break;
//           case 'Casino': tables = tablesState.filter(_t => _t.category === 'casino'); break;
//         }
//       }
//       if (excludeTableId) {
//         tables = tables.filter(_t => _t.tableId !== excludeTableId);
//       }
//       return [...tables].sort((a, b) => a.tableName.localeCompare(b.tableName));
//     }
//   }
// });

// export const { tableAdded, tablesLoaded } = tablesSlice.actions;
// export const { tablesFiltered } = tablesSlice.selectors;
// export default tablesSlice.reducer;



import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filters } from './filtersModel';
import { Table } from './tablesModel';

const initialState: Table[] = [];

const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    tableAdded(state, action: PayloadAction<Table>) {
      state.push(action.payload);
    },
    tablesLoaded(state, action: PayloadAction<Table[]>) {
      return action.payload;
    },
  },
  selectors: {
    tablesFiltered: (
      tablesState: Table[], // Explicitly type as Table[]
      filters: Filters,
      favTables?: string[],
      excludeTableId?: string
    ): Table[] => {
      let tables = tablesState;
      if (filters.tables && filters.tables !== 'all') {
        switch (filters.tables) {
          case 'Fun':
            tables = tablesState.filter((t) => t.category === 'fun');
            break;
          case 'Favourite':
            tables = tablesState.filter((t) => favTables?.includes(t.tableId));
            break;
          case 'Slots':
            tables = tablesState.filter((t) => t.category === 'slot');
            break;
          case 'Casino':
            tables = tablesState.filter((t) => t.category === 'casino');
            break;
          default:
            // Handle unexpected filter values gracefully
            console.warn(`Unexpected filter value: ${filters.tables}`);
            break;
        }
      }
      if (excludeTableId) {
        tables = tables.filter((t) => t.tableId !== excludeTableId);
      }
      return [...tables].sort((a, b) => a.tableName.localeCompare(b.tableName));
    },
  },
});

export const { tableAdded, tablesLoaded } = tablesSlice.actions;
export const { tablesFiltered } = tablesSlice.selectors;
export default tablesSlice.reducer;