import type { QueryClient } from "@tanstack/react-query"

import type { AuthContext } from "@/shared/model"

export type RouterContext = {
  queryClient: QueryClient
  auth: AuthContext
}
