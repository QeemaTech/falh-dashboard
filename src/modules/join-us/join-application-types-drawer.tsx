import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { AppDrawer } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import { toast } from "../../components/ui/sonner";
import {
  createJoinApplicationTypeApi,
  deleteJoinApplicationTypeApi,
  fetchJoinApplicationTypes,
  updateJoinApplicationTypeApi,
  type JoinApplicationType,
} from "../../services/admin-api";

const PROVIDER_TYPE_OPTIONS = [
  "DOCTOR",
  "ENGINEER",
  "CONSULTANT",
  "LAND_BROKER",
  "TRANSPORT",
  "SOLAR_ENERGY",
  "OTHER",
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

const emptyForm = {
  nameAr: "",
  nameEn: "",
  code: "",
  serviceProviderType: "OTHER",
};

export function JoinApplicationTypesDrawer({ open, onClose }: Props) {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<JoinApplicationType | null>(null);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["join-application-types"],
    queryFn: fetchJoinApplicationTypes,
    enabled: open,
  });

  const typeName = (type: JoinApplicationType) =>
    language === "ar" ? type.nameAr || type.nameEn : type.nameEn || type.nameAr;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        code: form.code.trim() || undefined,
        serviceProviderType: form.serviceProviderType,
      };
      if (editing) return updateJoinApplicationTypeApi(editing.id, payload);
      return createJoinApplicationTypeApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-application-types"] });
      setForm(emptyForm);
      setEditing(null);
      toast.success(editing ? t("joinUs.types.updated") : t("joinUs.types.created"));
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("joinUs.types.saveFailed")),
  });

  const toggleMutation = useMutation({
    mutationFn: (type: JoinApplicationType) =>
      updateJoinApplicationTypeApi(type.id, { isActive: !type.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-application-types"] });
      toast.success(t("joinUs.types.updated"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJoinApplicationTypeApi,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["join-application-types"] });
      const deactivated =
        result && typeof result === "object" && "deactivated" in result && result.deactivated;
      toast.success(deactivated ? t("joinUs.types.deactivated") : t("joinUs.types.deleted"));
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("joinUs.types.deleteFailed")),
  });

  function startEdit(type: JoinApplicationType) {
    setEditing(type);
    setForm({
      nameAr: type.nameAr,
      nameEn: type.nameEn,
      code: type.code,
      serviceProviderType: type.serviceProviderType || "OTHER",
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
  }

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={t("joinUs.types.title")}
      description={t("joinUs.types.subtitle")}
      width={520}
      footer={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={!form.nameAr.trim() || !form.nameEn.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {editing ? t("joinUs.types.save") : t("joinUs.types.add")}
          </Button>
          {editing ? (
            <Button variant="outlined" onClick={cancelEdit}>
              {t("joinUs.types.cancelEdit")}
            </Button>
          ) : null}
          <Button onClick={onClose}>{t("joinUs.types.close")}</Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {editing ? t("joinUs.types.editTitle") : t("joinUs.types.addTitle")}
        </Typography>
        <TextField
          size="small"
          fullWidth
          label={`${t("joinUs.types.nameAr")} *`}
          value={form.nameAr}
          onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
        />
        <TextField
          size="small"
          fullWidth
          label={`${t("joinUs.types.nameEn")} *`}
          value={form.nameEn}
          onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
        />
        {!editing ? (
          <TextField
            size="small"
            fullWidth
            label={t("joinUs.types.codeOptional")}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder={t("joinUs.types.codeHint")}
          />
        ) : null}
        <TextField
          select
          size="small"
          fullWidth
          label={t("joinUs.types.providerMapping")}
          value={form.serviceProviderType}
          onChange={(e) => setForm((f) => ({ ...f, serviceProviderType: e.target.value }))}
        >
          {PROVIDER_TYPE_OPTIONS.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`joinUs.types.provider.${value}` as "joinUs.types.provider.OTHER")}
            </MenuItem>
          ))}
        </TextField>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
          {t("joinUs.types.listTitle")}
        </Typography>

        {isLoading ? (
          <Stack sx={{ py: 3, alignItems: "center" }}>
            <CircularProgress size={24} />
          </Stack>
        ) : null}

        {!isLoading
          ? types.map((type) => (
              <Stack
                key={type.id}
                direction="row"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  opacity: type.isActive ? 1 : 0.6,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {typeName(type)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.code}
                    {type.isSystem ? ` · ${t("joinUs.types.system")}` : ""}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <Chip
                    size="small"
                    label={type.isActive ? t("joinUs.types.active") : t("joinUs.types.inactive")}
                    color={type.isActive ? "success" : "default"}
                    onClick={() => toggleMutation.mutate(type)}
                  />
                  <IconButton size="small" onClick={() => startEdit(type)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t("joinUs.types.confirmDelete"))) {
                        deleteMutation.mutate(type.id);
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))
          : null}
      </Stack>
    </AppDrawer>
  );
}
