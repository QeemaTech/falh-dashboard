import { useState } from "react";

export function useGlobalSearch(initial = "") {
  const [search, setSearch] = useState(initial);
  return { search, setSearch };
}
