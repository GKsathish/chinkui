const useSessionToken = (): boolean => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("token");
    }
    return false;
  };
  
  export default useSessionToken;
  