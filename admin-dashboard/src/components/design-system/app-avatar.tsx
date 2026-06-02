import { cn } from "../../utils/cn";

type AppAvatarProps = {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function AppAvatar({ name = "Admin User", src, size = "md", className }: AppAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--app-primary)] text-xs font-semibold text-white",
        size === "sm" && "size-8",
        size === "md" && "size-10",
        size === "lg" && "size-12",
        className
      )}
    >
      {src ? <img src={src} alt={name} className="size-full rounded-full object-cover" /> : initials}
    </div>
  );
}
