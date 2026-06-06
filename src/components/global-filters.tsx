import { MenuItem, TextField } from "@mui/material";
import { FilterBar } from "./layout";

type Props = {
  status: string;
  onStatusChange: (status: string) => void;
};

export function GlobalFilters({ status, onStatusChange }: Props) {
  return (
    <FilterBar>
      <TextField
        select
        label="Status"
        size="small"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">All statuses</MenuItem>
        <MenuItem value="ACTIVE">Active</MenuItem>
        <MenuItem value="SUSPENDED">Suspended</MenuItem>
        <MenuItem value="PENDING_VERIFICATION">Pending verification</MenuItem>
      </TextField>
    </FilterBar>
  );
}
