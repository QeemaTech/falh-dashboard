import { useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField, Typography } from "@mui/material";
import type { AdminCompany } from "../../services/admin-api";

type Props = {
  companies: AdminCompany[];
  loading?: boolean;
  selectedCompanyId: string;
  onSelect: (companyId: string) => void;
  label: string;
  hint: string;
  searchPlaceholder: string;
  emptyLabel: string;
};

export function BannerCompanyPicker({
  companies,
  loading,
  selectedCompanyId,
  onSelect,
  label,
  hint,
  searchPlaceholder,
  emptyLabel,
}: Props) {
  const [inputValue, setInputValue] = useState("");

  const selected = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  useEffect(() => {
    if (!selectedCompanyId) setInputValue("");
  }, [selectedCompanyId]);

  return (
    <Autocomplete
      options={companies}
      loading={loading}
      value={selected}
      inputValue={inputValue}
      onInputChange={(_event, value) => setInputValue(value)}
      onChange={(_event, company) => onSelect(company?.id || "")}
      getOptionLabel={(company) => company.name || ""}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(options, state) => {
        const q = state.inputValue.trim().toLowerCase();
        if (!q) return options.slice(0, 8);
        return options
          .filter(
            (company) =>
              company.name.toLowerCase().includes(q) ||
              company.city.toLowerCase().includes(q) ||
              (company.phone || "").toLowerCase().includes(q)
          )
          .slice(0, 12);
      }}
      noOptionsText={emptyLabel}
      renderOption={(props, company) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <div>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {company.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {company.city} · {company.phone}
              </Typography>
            </div>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={searchPlaceholder}
          helperText={hint}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.slotProps?.input?.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
