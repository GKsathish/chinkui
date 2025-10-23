import authService from "../components/utils/authService";
import csrfTokenService from "../components/utils/csrfTokenService";

// Types for the API response
export interface BetHistoryItem {
  round_id: string;
  table_id: string;
  table_name: string;
  stake_amount: number;
  is_free_spin: boolean;
  golden_wheel_spin: boolean;
  game_status: string;
  result: string[][]; // include result array
  resultList: string[][][];

  won_amount: number;
  created_at: number;
  updated_at: number;
}

export interface BetHistoryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BetHistoryResponse {
  status: string;
  items: BetHistoryItem[];
  pagination: BetHistoryPagination;
}

export interface BetHistoryFilters {
  tableId?: string;
  page?: number;
  pageSize?: number;
  startDate?: number;
  endDate?: number;
}

class BetHistoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || "";
  }

  public async fetchBetHistory(
    filters: BetHistoryFilters = {}
  ): Promise<BetHistoryResponse | null> {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.log("No token found for  history fetch");
      return null;
    }

    try {
      const url = `/unity/get-game-history`;
      const payload = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 10,
        tableId: filters.tableId || undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      const [response] = await Promise.all([
        csrfTokenService.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const data = response.data;

      if (data && data.status === "RS_OK") {
        
        const items: BetHistoryItem[] = data.history.map((item: any) => ({
          round_id: item.roundId,
          table_id: item.tableId || filters.tableId || "", // Use tableId from item or fallback to filter
          table_name: "",
          stake_amount: item.betAmount,
          is_free_spin: item.isFreeSpin || false,
          golden_wheel_spin: false,
          game_status: item.won > 0 ? "closed" : "open",
          won_amount: item.won,
          result: item.result, // map result array
          resultList: item.resultList, // map result array

          created_at: item.endTime,
          updated_at: item.endTime,
        }));

        const pagination: BetHistoryPagination = {
          page: data.page,
          pageSize: data.pageSize,
          total: data.totalRecords,
          totalPages: data.totalPages,
        };

        return {
          status: "success",
          items,
          pagination,
        };
      } else {
        console.error("Invalid response from  history API:", data);
        return null;
      }
    } catch (error: any) {
      console.error("Error fetching b history:", error);

      if (error.response?.status === 401) {
        console.log(
          "Unauthorized access - clearing session and redirecting to login"
        );
        authService.handleTokenExpiration(" History API returned 401");
        return null;
      }

      throw error;
    }
  }
}

const betHistoryService = new BetHistoryService();
export default betHistoryService;
