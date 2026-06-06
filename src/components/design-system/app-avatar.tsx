import { Avatar } from "@mui/material";

type AppAvatarProps = {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = { sm: 32, md: 40, lg: 48 };

export function AppAvatar({ name = "Admin User", src, size = "md", className }: AppAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar
      className={className}
      src={src}
      alt={name}
      sx={{ width: sizeMap[size], height: sizeMap[size], bgcolor: "primary.main", fontWeight: 700 }}
    >
      {initials}
    </Avatar>
  );
}
