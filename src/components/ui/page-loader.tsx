import { CircularProgress, Stack, Typography } from "@mui/material";

type Props = {
  label?: string;
};

export function PageLoader({ label }: Props) {
  return (
    <Stack spacing={2} sx={{ py: 6, alignItems: "center", justifyContent: "center" }}>
      <CircularProgress size={28} />
      {label ? (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      ) : null}
    </Stack>
  );
}
