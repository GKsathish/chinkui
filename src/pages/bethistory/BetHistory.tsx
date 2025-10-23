
import React, { useState, useMemo } from "react";

import { useSelector } from "react-redux";
import betHistoryService, {
  BetHistoryItem,
  BetHistoryFilters,
} from "../../services/betHistoryService";

import DateRangePicker from "./DateRangePicker"; // Use local component
import { RootState } from "../../store/store";
import { tablesFiltered } from "../../store/tablesSlice";
import { Table } from "../../store/tablesModel";
interface BetHistoryProps {
  isOpen?: boolean;
  onClose?: () => void;
}
const BetHistory: React.FC<BetHistoryProps> = ({ isOpen = true, onClose }) => {
  const [categoryFilter] = useState<
    "all" | "Fun" | "Slots" | "Casino" | "Favourite"
  >("all");
  const [favTables] = useState<string[]>([]);

  const tables = useSelector((state: RootState) =>
    tablesFiltered(state, { tables: categoryFilter }, favTables, undefined)
  );

  const tableOptions = useMemo(() => {
    const options = new Map<
      string,
      { id: string; name: string; slug: string }
    >();
    tables.forEach((table: Table) => {
      options.set(table.tableId, {
        id: table.tableId,
        name: table.tableName,
        slug: table.slug || table.tableId.toLowerCase().replace(/\s+/g, ""), // fallback if slug not available
      });
    });
    return Array.from(options.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [tables]);

  // State management
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [tableIdFilter, setTableIdFilter] = useState("");
  const [selectedBet, setSelectedBet] = useState<BetHistoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Add date range state with proper typing
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const pageSize = 10;

  const getTableNameFromId = (tableId: string): string => {
    const table = tableOptions.find((option) => option.id === tableId);
    return table ? table.name : tableId;
  };

  const getTableSlugFromId = (tableId: string): string => {
    const table = tableOptions.find((option) => option.id === tableId);
    return table ? table.slug : tableId;
  };

  // 3. Create a function to construct the image URL
  const getImageUrl = (item: string, tableId: string): string => {
    console.log(item, tableId);
    const slug = getTableSlugFromId(tableId);
    const baseUrl =
      "https://ritzzy-extra-assets.s3.eu-west-2.amazonaws.com/game-history-assets";

    // Assuming item is like "77" or the image filename without extension
    return `${baseUrl}/${slug}/${item}.png`;
  };

  const fetchBetHistory = async (filters: BetHistoryFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await betHistoryService.fetchBetHistory(filters);

      if (response) {
        setBetHistory(response.items);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      } else {
        throw new Error("No data returned from history API");
      }
    } catch (err: any) {
      console.error("Error fetching history:", err);
      setBetHistory([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotal(0);
      setError(err.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove automatic data fetching on mount
  // Data will only be fetched when user selects a game and clicks Apply

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && tableIdFilter) {
      fetchBetHistory({
        page: newPage,
        pageSize,
        tableId: tableIdFilter,
        startDate: dateRange.startDate.getTime(),
        endDate: dateRange.endDate.getTime(),
      });
    }
  };

  const handleDateRangeChange = (newDateRange: {
    startDate: Date;
    endDate: Date;
  }) => {
    setDateRange(newDateRange);
  };

  const handleTableFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedTableId = event.target.value;
    setTableIdFilter(selectedTableId);
  };

  const handleApplyFilters = () => {
    // Only fetch data if a game is selected
    if (!tableIdFilter) {
      return;
    }

    setCurrentPage(1);
    setHasSearched(true);
    fetchBetHistory({
      page: 1,
      pageSize,
      tableId: tableIdFilter,
      startDate: dateRange.startDate.getTime(),
      endDate: dateRange.endDate.getTime(),
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const renderBetHistory = () => {
    // Show initial message if no game is selected
    if (!tableIdFilter) {
      return (
        <div className="text-center text-gray-400 py-8 sm:py-12 text-sm sm:text-base">
          Select a game to get  history
        </div>
      );
    }

    // Show "no data found" message if a game is selected but no results
    if (!betHistory.length && hasSearched) {
      return (
        <div className="text-center text-gray-400 py-8 sm:py-12 text-sm sm:text-base">
          No  history found
        </div>
      );
    }

    // Show empty state if no search has been performed yet
    if (!betHistory.length && !hasSearched) {
      return (
        <div className="text-center text-gray-400 py-8 sm:py-12 text-sm sm:text-base">
          Click Apply to load  history
        </div>
      );
    }
    console.log(selectedBet?.table_id);
    return (
      <div className="w-full overflow-x-auto ">
        <div className="w-full block align-middle ">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#e3c4a3]/30">
                <th className="text-left py-2 sm:py-3 px-1 sm:px-1 text-[#e3c4a3] text-xs sm:text-sm">
                  Date
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-1 text-[#e3c4a3] text-xs sm:text-sm ">
                  Round ID
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-1 text-[#e3c4a3] text-xs sm:text-sm">
                  Stake Amount
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-1 text-[#e3c4a3] text-xs sm:text-sm">
                  Won Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {betHistory.map((bet: BetHistoryItem, index: number) => (
                <tr
                  key={bet.round_id || index}
                  className="border-b border-gray-700/50"
                >
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-white text-xs">
                    {formatTimestamp(bet.updated_at)}
                  </td>
                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-blue font-mono text-xs sm:text-sm">
                    <div
                      className={`break-all max-w-[100px] sm:max-w-[150px] leading-tight underline cursor-pointer transition-colors
    ${
      selectedBet?.round_id === bet.round_id
        ? "text-blue-700 text-white "
        : "text-blue-600 hover:text-white"
    }`}
                      onClick={() => {
                        console.log("Selected bet:", bet);
                        setSelectedBet(bet);
                      }}
                    >
                      {bet.round_id}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-white font-mono text-xs sm:text-sm">
                    {bet.stake_amount.toLocaleString()}
                  </td>
                  <td
                    className={`py-2 sm:py-3 px-1 sm:px-2 font-mono text-xs sm:text-sm font-semibold ${
                      bet.won_amount === 0 ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {bet.won_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedBet && (

            <div className="fixed inset-0 bg-black/70 flex items-center m-1 justify-center z-[1100]">
              <div className="bg-[#1a1a1a] border border-[#e3c4a3]/60 rounded-lg p-6 max-w-md w-full text-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#e3c4a3]">
                    Details
                  </h3>
                  <button
                    onClick={() => setSelectedBet(null)}
                    className="text-white-400 px-2 rounded bg-red-400 border-white-400 hover:text-white-500 font-bold text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  
                  <p>
                    <span className="text-[#e3c4a3]">Round ID :</span>{" "}
                    {selectedBet.round_id}
                  </p>
                  <p>
                    <span className="text-[#e3c4a3]">Date :</span>{" "}
                    {formatTimestamp(selectedBet.updated_at)}
                  </p>
                  <p>
                    <span className="text-[#e3c4a3]">Stake Amount :</span>{" "}
                    {selectedBet.stake_amount.toLocaleString()} 
                  </p>
                  <p>
                    <span className="text-[#e3c4a3]">Won Amount :</span>{" "}
                    <span
                      className={
                        selectedBet.won_amount === 0
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {selectedBet.won_amount.toLocaleString()} 
                    </span>
                  </p>
                  <p>
                    <span className="text-[#e3c4a3]">Is Free Spin :</span>{" "}
                    <span className={selectedBet.is_free_spin ? "text-green-400" : "text-red-400"}>
                      {selectedBet.is_free_spin ? "True" : "False"}
                    </span>
                  </p>
                  {/* Result Matrix */}
                  <div>
                    <span className="text-[#e3c4a3]">Result :</span>
                    <div className="mt-2 space-y-2">
                      {selectedBet?.result && selectedBet.result.length > 0 ? (
                        // Render result (2D array: [][])
                        selectedBet.result.map((row, rowIndex) => (
                          <div
                            key={`main-row-${rowIndex}`}
                            className="flex gap-1 justify-center"
                          >
                            {row.map((item, colIndex) => (
                              <img
                                key={`main-col-${rowIndex}-${colIndex}`}
                                // src={images[item] || "/fallback.png"}
                                src={getImageUrl(item, selectedBet?.table_id)} // Pass the selected table ID
                                alt={item}
                                className="w-10 h-10"
                              />
                            ))}
                          </div>
                        ))
                      ) : selectedBet?.resultList &&
                        selectedBet.resultList.length > 0 ? (
                        <div>
                          <div className="mb-4">
                            {selectedBet.resultList[currentResultIndex].map(
                              (row, rowIndex) => (
                                <div
                                  key={`game-row-${currentResultIndex}-${rowIndex}`}
                                  className="flex gap-1 justify-center"
                                >
                                  {row.map((item, colIndex) => (
                                    <img
                                      key={`game-col-${currentResultIndex}-${rowIndex}-${colIndex}`}
                                      src={getImageUrl(
                                        item,
                                        selectedBet?.table_id
                                      )} // Pass the selected table ID
                                      alt={item}
                                      className="w-10 h-10"
                                    />
                                  ))}
                                </div>
                              )
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <button
                              onClick={() =>
                                setCurrentResultIndex((prev) =>
                                  Math.max(0, prev - 1)
                                )
                              }
                              disabled={currentResultIndex === 0}
                              className="text-2xl text-black bg-yellow-400 px-1 rounded disabled:opacity-30 hover:text-black transition-colors"
                            >
                              &lt;
                            </button>
                            <span className="text-gray-400 text-xs">
                              Matrix: {currentResultIndex + 1} /{" "}
                              {selectedBet.resultList.length}
                            </span>
                            <button
                              onClick={() => {
                                const maxIndex =
                                  selectedBet.resultList.length - 1;
                                setCurrentResultIndex((prev) =>
                                  Math.min(maxIndex, prev + 1)
                                );
                              }}
                              disabled={
                                currentResultIndex ===
                                selectedBet.resultList.length - 1
                              }
                              className="text-2xl text-black bg-yellow-400 px-1 rounded disabled:opacity-30 hover:text-black transition-colors"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Fallback if neither result nor resultList is available
                        <div className="text-gray-500">
                          No results available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // Removed scroll effect since we're using buttons
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center mt-4 sm:mt-6 space-x-2 sm:space-x-3">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-[#e3c4a3]/20 text-[#e3c4a3] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e3c4a3]/30 transition-colors"
        >
          <span className="sm:hidden">‹</span>
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="text-[#e3c4a3] text-xs sm:text-sm px-2">
          <span className="sm:hidden">
            {currentPage}/{totalPages}
          </span>
          <span className="hidden sm:inline">
            Page {currentPage} of {totalPages}
          </span>
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-[#e3c4a3]/20 text-[#e3c4a3] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e3c4a3]/30 transition-colors"
        >
          <span className="sm:hidden">›</span>
          <span className="hidden sm:inline">Next</span>
        </button>
      </div>
    );
  };

  // Modal rendering
  if (isOpen && onClose) {
    return (
      <div className="fixed inset-0 bg-black/70 z-[1000]">
        <div
          className="w-full h-full bg-[#0D0E0F] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-3 rounded sm:p-2 border border-[#e3c4a3]/30">
            <h2 className="text-xl sm:text-2xl font-bold text-[#e3c4a3]">
              History
            </h2>
            <button
              className="text-white bg-red-400 text-xl border-red-400 px-2 sm:text-2xl font-bold rounded hover:text-[#e3c4a3] transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-[#1a1a1a] border-b border-[#e3c4a3]/30 p-2 sm:p-2">
            <div className="flex flex-col sm:flex-row justify-between">
              {/* Date Range Picker */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                <label className="text-[#e3c4a3] font-semibold text-sm sm:text-base whitespace-nowrap">
                  Date Range:
                </label>
                <div className="w-full sm:w-auto">
                  <DateRangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    size="small"
                    fullWidth={false}
                  />
                </div>

                {/* Table Filter */}
                <label className="text-[#e3c4a3] font-semibold text-sm sm:text-base whitespace-nowrap">
                  Filter by Game:
                </label>
                <select
                  value={tableIdFilter}
                  onChange={handleTableFilterChange}
                  className="w-full sm:w-auto p-2.5 bg-[#0D0E0F] border border-[#e3c4a3]/50 rounded text-white text-sm focus:outline-none focus:border-[#e3c4a3] focus:ring-1 focus:ring-[#e3c4a3]"
                >
                  <option value="" disabled>
                    Select a game
                  </option>
                  {tableOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <button
                  className={`font-semibold px-4 py-1 rounded-md transition ${
                    tableIdFilter
                      ? "bg-yellow-400 border border-yellow-400 hover:bg-yellow-500 hover:border-yellow-500"
                      : "bg-gray-600 border border-gray-600 cursor-not-allowed opacity-50"
                  }`}
                  onClick={handleApplyFilters}
                  disabled={!tableIdFilter}
                >
                  Apply
                </button>
              </div>
              <div className="flex hidden sm:block flex-col sm:flex-row gap-3 px-2 sm:gap-4 items-end sm:items-center">
                <button
                  className="bg-yellow-400 border border-yellow-400 font-semibold px-4 py-1 rounded-md hover:bg-yellow-500 hover:border-yellow-500 transition"
                  onClick={onClose}
                >
                  Back
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400 text-sm">
                  Loading...
                </div>
              </div>
            )}

            {!isLoading && (
              <>
                {error ? (
                  <div className="text-center text-red-400 py-4 text-sm sm:text-base">
                    {error}
                  </div>
                ) : (
                  <>
                    {tableIdFilter && hasSearched && (
                      <div className="text-[#e3c4a3] mb-4 text-sm sm:text-base">
                        Showing {betHistory.length} of {total} results
                        {` for "${getTableNameFromId(tableIdFilter)}"`}
                      </div>
                    )}

                    <div className="bg-[#0D0E0F] border border-[#e3c4a3]/30 rounded-lg overflow-hidden mb-6">
                      {renderBetHistory()}
                    </div>

                    {tableIdFilter && renderPagination()}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Your existing page rendering code here...
  return null;
};

export default BetHistory;
