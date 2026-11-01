import { useMemo } from "react";
import { Autocomplete, Checkbox, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminCategories, type AdminCategory } from "../../services/admin-api";
import { useI18n } from "../../hooks/use-i18n";

type Props = {
  value: string[];
  onChange: (categoryIds: string[]) => void;
  disabled?: boolean;
  size?: "small" | "medium";
};

export function CompanyCategorySelect({ value, onChange, disabled, size = "small" }: Props) {
  const { t, language } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories-company-select"],
    queryFn: () => fetchAdminCategories({ page: 1, limit: 200, sortBy: "sortOrder", sortOrder: "asc" }),
  });

  const options = data?.items || [];
  const selected = useMemo(
    () => options.filter((category) => value.includes(category.id)),
    [options, value]
  );

  const labelOf = (category: AdminCategory) =>
    language === "ar"
      ? category.nameAr || category.nameEn || category.id
      : category.nameEn || category.nameAr || category.id;

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      disabled={disabled}
      loading={isLoading}
      options={options}
      value={selected}
      onChange={(_event, next) => onChange(next.map((category) => category.id))}
      getOptionLabel={labelOf}
      isOptionEqualToValue={(option, item) => option.id === item.id}
      renderOption={(props, option, { selected: isSelected }) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Checkbox size="small" checked={isSelected} sx={{ mr: 1 }} />
            {labelOf(option)}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size={size}
          label={t("companies.allowedCategories")}
          helperText={t("companies.allowedCategoriesHint")}
          placeholder={t("companies.selectCategories")}
        />
      )}
    />
  );
}
