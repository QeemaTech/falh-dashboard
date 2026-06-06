import { Search } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { useI18n } from "../hooks/use-i18n";

type Props = { value: string; onChange: (value: string) => void };

export function SearchBar({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t("search.placeholder")}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
