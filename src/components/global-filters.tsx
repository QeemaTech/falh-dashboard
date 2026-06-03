import { Input } from "./ui/input";
import { AppSelect } from "./design-system";

type Props = {
  status: string;
  onStatusChange: (status: string) => void;
};

export function GlobalFilters({ status, onStatusChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-(--app-border) bg-(--app-surface) p-3 shadow-(--app-shadow-soft)">
      <AppSelect
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="PENDING_VERIFICATION">Pending verification</option>
      </AppSelect>
      <Input placeholder="Advanced filter..." className="max-w-60" />
    </div>
  );
}
