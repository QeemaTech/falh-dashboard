import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Check, Delete, Save, Security } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
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

export function RolesPermissionsPage() {
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
    mutationFn: createRoleApi,
    onSuccess: () => {
      setNewRoleName("");
      queryClient.invalidateQueries({ queryKey: ["roles-permissions"] });
      toast.success("Role created");
    },
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
      toast.success("Role updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: () => {
      setSelectedRoleId("");
      setEditableName("");
      setPermissions({});
      queryClient.invalidateQueries({ queryKey: ["roles-permissions"] });
      toast.success("Role deleted");
    },
  });

  const modules = rolesQuery.data?.modules || ["users", "products", "orders", "companies", "categories", "settings", "reports"];
  const actions = rolesQuery.data?.actions || ["view", "create", "update", "delete"];
  const roles = rolesQuery.data?.roles || [];

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || null, [roles, selectedRoleId]);

  const loadRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setSelectedRoleId(roleId);
    setEditableName(role.name);
    setPermissions(role.permissions || emptyPermissions(modules));
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

  if (rolesQuery.isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (rolesQuery.isError) {
    return <EmptyState title="Failed to load roles" description={(rolesQuery.error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Create, edit, delete roles and assign permissions through matrix UI."
        icon={<Security fontSize="small" />}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Roles
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="New role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <IconButton color="primary" onClick={() => createMutation.mutate(newRoleName)} disabled={!newRoleName.trim()}>
                <Add />
              </IconButton>
            </Stack>
            <List dense disablePadding>
              {roles.map((role) => (
                <ListItemButton
                  key={role.id}
                  selected={selectedRoleId === role.id}
                  onClick={() => loadRole(role.id)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemText primary={role.name} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2 }}>
            {selectedRole ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Role Name"
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Button color="error" startIcon={<Delete />} onClick={() => deleteMutation.mutate(selectedRole.id)}>
                    Delete Role
                  </Button>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                        {actions.map((action) => (
                          <TableCell key={action} align="center" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                            {action}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modules.map((moduleName) => (
                        <TableRow key={moduleName}>
                          <TableCell sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                            {moduleName}
                          </TableCell>
                          {actions.map((action) => {
                            const isChecked = Boolean(permissions?.[moduleName]?.[action as keyof PermissionActions]);
                            return (
                              <TableCell key={action} align="center">
                                <Checkbox
                                  size="small"
                                  checked={isChecked}
                                  icon={<Box sx={{ width: 20, height: 20, border: 1, borderColor: "divider", borderRadius: 1 }} />}
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

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() =>
                      saveMutation.mutate({
                        roleId: selectedRole.id,
                        name: editableName,
                        rolePermissions: permissions,
                      })
                    }
                  >
                    Save Changes
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Select a role to edit permissions matrix.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
