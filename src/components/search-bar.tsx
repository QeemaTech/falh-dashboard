import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useI18n } from "../hooks/use-i18n";

type Props = { value: string; onChange: (value: string) => void };

export function SearchBar({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute inset-s-4 top-3.5 size-4 text-neutral-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("search.placeholder")}
        className="ps-10"
      />
    </div>
  );
}
