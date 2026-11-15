import { MenuItem, TextField } from "@mui/material";
import type { AdminOrderStatus } from "../../services/admin-api";

export const ORDER_STATUSES: AdminOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "DELIVERED",
  "CANCELLED",
];

type OrderStatusSelectProps = {
  value: AdminOrderStatus;
  disabled?: boolean;
  onChange: (status: AdminOrderStatus) => void;
  label: (status: AdminOrderStatus) => string;
};

export function OrderStatusSelect({ value, disabled, onChange, label }: OrderStatusSelectProps) {
  return (
    <TextField
      select
      size="small"
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value as AdminOrderStatus;
        if (next !== value) onChange(next);
      }}
      onClick={(event) => event.stopPropagation()}
      sx={{
        minWidth: 148,
        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
      }}
    >
      {ORDER_STATUSES.map((status) => (
        <MenuItem key={status} value={status}>
          {label(status)}
        </MenuItem>
      ))}
    </TextField>
  );
}
