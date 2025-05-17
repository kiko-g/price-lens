import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => axios.get("/api/products"),
  })
}
