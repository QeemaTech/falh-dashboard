import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Save, Shield, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
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

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <Card className="flex items-center justify-between bg-linear-to-r from-[#23673A] to-[#2f8f52] text-white">
        <div>
          <h2 className="text-xl font-semibold">Roles & Permissions</h2>
          <p className="text-sm text-white/90">Create, edit, delete roles and assign permissions through matrix UI.</p>
        </div>
        <Shield className="size-10 opacity-80" />
      </Card>

      {rolesQuery.isLoading ? (
        <Card>Loading roles and permissions...</Card>
      ) : rolesQuery.isError ? (
        <Card>Failed to load roles and permissions: {(rolesQuery.error as Error).message}</Card>
      ) : (
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="space-y-3 lg:col-span-4">
          <h3 className="font-semibold">Roles</h3>
          <div className="flex items-center gap-2">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="New role name"
            />
            <Button onClick={() => createMutation.mutate(newRoleName)} disabled={!newRoleName.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => loadRole(role.id)}
                className={`w-full rounded-xl border px-3 py-2 text-start text-sm transition ${
                  selectedRoleId === role.id
                    ? "border-[#23673A] bg-[#23673A]/10 text-[#23673A]"
                    : "border-(--app-border) hover:border-[#23673A]/40 hover:bg-(--app-surface-alt)"
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 lg:col-span-8">
          {selectedRole ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-52 flex-1">
                  <p className="mb-1 text-xs text-neutral-500">Role Name</p>
                  <Input value={editableName} onChange={(e) => setEditableName(e.target.value)} />
                </div>
                <Button variant="ghost" onClick={() => deleteMutation.mutate(selectedRole.id)}>
                  <Trash2 className="me-1 size-4 text-red-500" />
                  Delete Role
                </Button>
              </div>

              <div className="overflow-auto rounded-2xl border border-(--app-border)">
                <table className="w-full text-sm">
                  <thead className="bg-(--app-surface-alt)">
                    <tr>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-(--app-text-muted)">
                        Module
                      </th>
                      {actions.map((action) => (
                        <th
                          key={action}
                          className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-(--app-text-muted)"
                        >
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((moduleName) => (
                      <tr key={moduleName} className="border-t border-(--app-border)">
                        <td className="px-4 py-3 font-medium capitalize text-(--app-text-primary)">{moduleName}</td>
                        {actions.map((action) => {
                          const isChecked = Boolean(permissions?.[moduleName]?.[action]);
                          return (
                            <td key={action} className="px-3 py-3 text-center">
                              <button
                                type="button"
                                aria-label={`${moduleName} ${action}`}
                                onClick={() =>
                                  togglePermission(moduleName, action as keyof PermissionActions, !isChecked)
                                }
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                  isChecked
                                    ? "border-[#23673A] bg-[#23673A] text-white shadow-sm"
                                    : "border-(--app-border) bg-(--app-surface) text-transparent hover:border-[#23673A]/50"
                                }`}
                              >
                                <Check className="size-4" />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    saveMutation.mutate({
                      roleId: selectedRole.id,
                      name: editableName,
                      rolePermissions: permissions,
                    })
                  }
                >
                  <Save className="me-2 size-4" />
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Select a role to edit permissions matrix.</p>
          )}
        </Card>
      </div>
      )}
    </div>
  );
}
