import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Check, Delete, Lock, Save, Security } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { EmptyState, PageHeader } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";
import { PermissionGate } from "../../components/permission-gate";
import {
  createRoleApi,
  deleteRoleApi,
  fetchRolesPermissions,
  updateRoleApi,
  type PermissionActions,
} from "../../services/admin-api";

type PermissionRecord = Record<string, PermissionActions>;

function emptyPermissions(modules: string[]): PermissionRecord {
  return modules.reduce(
    (acc, moduleName) => ({
      ...acc,
      [moduleName]: { view: false, create: false, update: false, delete: false },
    }),
    {}
  );
}

function moduleLabel(t: (key: string) => string, moduleName: string) {
  const key = `rbac.modules.${moduleName}`;
  const translated = t(key);
  return translated === key ? moduleName : translated;
}

function actionLabel(t: (key: string) => string, action: string) {
  const key = `rbac.actions.${action}`;
  const translated = t(key);
  return translated === key ? action : translated;
}

export function RolesPermissionsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [editableName, setEditableName] = useState("");
  const [permissions, setPermissions] = useState<PermissionRecord>({});

  const rolesQuery = useQuery({
    queryKey: ["roles-permissions"],
    queryFn: fetchRolesPermissions,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createRoleApi({ name }),
    onSuccess: (role) => {
      setNewRoleName("");
      queryClient.invalidateQueries({ queryKey: ["roles-permissions"] });
      const moduleList = rolesQuery.data?.modules || [];
      setSelectedRoleId(role.id);
      setEditableName(role.name);
      setPermissions(emptyPermissions(moduleList));
      toast.success(t("rbac.roleCreated"));
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : t("rbac.saveFailed")),
  });

  const saveMutation = useMutation({
    mutationFn: ({
      roleId,
      name,
      rolePermissions,
    }: {
      roleId: string;
      name: string;
      rolePermissions: PermissionRecord;
    }) => updateRoleApi(roleId, { name, permissions: rolePermissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-permissions"] });
      toast.success(t("rbac.roleUpdated"));
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : t("rbac.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: () => {
      setSelectedRoleId("");
      setEditableName("");
      setPermissions({});
      queryClient.invalidateQueries({ queryKey: ["roles-permissions"] });
      toast.success(t("rbac.roleDeleted"));
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : t("rbac.deleteFailed")),
  });

  const modules = rolesQuery.data?.modules || [];
  const actions = rolesQuery.data?.actions || ["view", "create", "update", "delete"];
  const roles = rolesQuery.data?.roles || [];

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const loadRole = (roleId: string, name?: string, perms?: PermissionRecord) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role && !name) return;
    setSelectedRoleId(roleId);
    setEditableName(name || role?.name || "");
    setPermissions(perms || role?.permissions || emptyPermissions(modules));
  };

  const togglePermission = (moduleName: string, action: keyof PermissionActions, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleName]: {
        ...(prev[moduleName] || { view: false, create: false, update: false, delete: false }),
        [action]: checked,
      },
    }));
  };

  const isSuperAdmin = selectedRole?.slug === "super-admin";
  const isReadOnly = Boolean(selectedRole?.isSystemRole);

  if (rolesQuery.isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (rolesQuery.isError) {
    return (
      <EmptyState
        title={t("rbac.loadFailed")}
        description={(rolesQuery.error as Error).message}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("rbac.title")}
        subtitle={t("rbac.subtitle")}
        icon={<Security fontSize="small" />}
      />

      <Alert severity="info">{t("rbac.hint")}</Alert>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: "divider" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t("rbac.rolesList")}
            </Typography>
            <PermissionGate permission="roles.create">
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t("rbac.newRolePlaceholder")}
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <IconButton
                  color="primary"
                  onClick={() => createMutation.mutate(newRoleName)}
                  disabled={!newRoleName.trim() || createMutation.isPending}
                >
                  <Add />
                </IconButton>
              </Stack>
            </PermissionGate>
            <List dense disablePadding>
              {roles.map((role) => (
                <ListItemButton
                  key={role.id}
                  selected={selectedRoleId === role.id}
                  onClick={() => loadRole(role.id)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <span>{role.name}</span>
                        {role.isSystemRole ? (
                          <Chip size="small" icon={<Lock sx={{ fontSize: 14 }} />} label={t("rbac.systemRole")} />
                        ) : null}
                      </Stack>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: "divider" }}>
            {selectedRole ? (
              <Stack spacing={2}>
                {isSuperAdmin ? <Alert severity="warning">{t("rbac.superAdminLocked")}</Alert> : null}
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={t("rbac.roleName")}
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    disabled={isReadOnly}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <PermissionGate permission="roles.delete">
                    <Button
                      color="error"
                      startIcon={<Delete />}
                      disabled={isReadOnly || deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(selectedRole.id)}
                    >
                      {t("rbac.deleteRole")}
                    </Button>
                  </PermissionGate>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t("rbac.module")}</TableCell>
                        {actions.map((action) => (
                          <TableCell key={action} align="center" sx={{ fontWeight: 700 }}>
                            {actionLabel(t, action)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modules.map((moduleName) => (
                        <TableRow key={moduleName}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {moduleLabel(t, moduleName)}
                          </TableCell>
                          {actions.map((action) => {
                            const modulePerms = permissions?.[moduleName];
                            const hasAction = action in (modulePerms || {});
                            if (!hasAction) {
                              return (
                                <TableCell key={action} align="center">
                                  —
                                </TableCell>
                              );
                            }
                            const isChecked = Boolean(modulePerms?.[action as keyof PermissionActions]);
                            return (
                              <TableCell key={action} align="center">
                                <Checkbox
                                  size="small"
                                  checked={isChecked}
                                  disabled={isReadOnly}
                                  icon={
                                    <Box
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: 1,
                                      }}
                                    />
                                  }
                                  checkedIcon={<Check fontSize="small" />}
                                  onChange={(_, checked) =>
                                    togglePermission(moduleName, action as keyof PermissionActions, checked)
                                  }
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <PermissionGate permission="roles.update">
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isReadOnly || saveMutation.isPending}
                      onClick={() =>
                        saveMutation.mutate({
                          roleId: selectedRole.id,
                          name: editableName,
                          rolePermissions: permissions,
                        })
                      }
                    >
                      {t("rbac.saveChanges")}
                    </Button>
                  </Box>
                </PermissionGate>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                {t("rbac.selectRole")}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
