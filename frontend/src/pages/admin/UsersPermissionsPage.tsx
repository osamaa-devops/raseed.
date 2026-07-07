import { Edit, Plus, RefreshCcw, Shield, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { branchesService } from "../../services/branchesService";
import { rolesService } from "../../services/rolesService";
import { usersService, type CreateUserRequest } from "../../services/usersService";
import type { Branch, Role, User, UserStatus } from "../../types";

const emptyForm: CreateUserRequest = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
  branchId: "",
  status: "ACTIVE",
};

export function UsersPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<CreateUserRequest>(emptyForm);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const branchById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch])), [branches]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, rolesResponse, branchesResponse] = await Promise.all([
        usersService.list(),
        rolesService.list(),
        branchesService.getBranches(),
      ]);
      setUsers(usersResponse);
      setRoles(rolesResponse);
      setBranches(branchesResponse);
      setForm((current) => ({
        ...current,
        roleId: current.roleId || rolesResponse.find((role) => role.name !== "super_admin")?.id || rolesResponse[0]?.id || "",
        branchId: current.branchId || branchesResponse.find((branch) => branch.isDefault)?.id || branchesResponse[0]?.id || "",
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      roleId: roles.find((role) => role.name !== "super_admin")?.id || roles[0]?.id || "",
      branchId: branches.find((branch) => branch.isDefault)?.id || branches[0]?.id || "",
    });
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email ?? "",
      phone: user.phone ?? "",
      password: "",
      roleId: user.roleId ?? "",
      branchId: user.branchId ?? "",
      status: user.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.roleId) {
      setError("الاسم والدور مطلوبان.");
      return;
    }
    if (!editing && form.password.trim().length < 8) {
      setError("كلمة المرور مطلوبة ويجب ألا تقل عن 8 أحرف.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        branchId: form.branchId || undefined,
        password: form.password.trim(),
      };
      if (editing) {
        await usersService.update(editing.id, {
          ...payload,
          password: payload.password || undefined,
          branchId: payload.branchId ?? null,
        });
      } else {
        await usersService.create(payload);
      }
      setOpen(false);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ المستخدم");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (user: User, status: UserStatus) => {
    setError(null);
    try {
      await usersService.updateStatus(user.id, status);
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "تعذر تغيير حالة المستخدم");
    }
  };

  return (
    <div>
      <PageHeader title="المستخدمين والصلاحيات" description="إدارة مستخدمي المحل وربطهم بالأدوار والفروع." />
      <div className="mb-4 flex justify-end">
        <AppButton icon={Plus} onClick={openCreate}>مستخدم جديد</AppButton>
      </div>
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? (
        <AppCard>جار تحميل المستخدمين...</AppCard>
      ) : users.length === 0 ? (
        <EmptyState icon={Shield} title="لا يوجد مستخدمون" description="أضف أول مستخدم وحدد له الدور والفرع المناسبين." />
      ) : (
        <DataTable
          columns={["الاسم", "الدور", "الفرع", "الهاتف", "البريد", "الحالة", "آخر دخول", "الإجراءات"]}
          rows={users}
          renderRow={(user) => (
            <tr key={user.id} className="border-t border-border hover:bg-table-row-hover">
              <td className="px-4 py-3 font-semibold">{user.name}</td>
              <td className="px-4 py-3">{roleLabel(roleById.get(user.roleId ?? "")?.name)}</td>
              <td className="px-4 py-3 text-muted-foreground">{branchById.get(user.branchId ?? "")?.name ?? "-"}</td>
              <td className="px-4 py-3">{user.phone ?? "-"}</td>
              <td className="px-4 py-3">{user.email ?? "-"}</td>
              <td className="px-4 py-3"><StatusBadge label={statusLabel(user.status)} tone={statusTone(user.status)} /></td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" icon={Edit} onClick={() => openEdit(user)}>تعديل</AppButton>
                  {user.status === "ACTIVE" ? (
                    <AppButton variant="ghost" icon={UserX} onClick={() => void changeStatus(user, "DISABLED")}>تعطيل</AppButton>
                  ) : (
                    <AppButton variant="ghost" icon={RefreshCcw} onClick={() => void changeStatus(user, "ACTIVE")}>تفعيل</AppButton>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? "تعديل مستخدم" : "مستخدم جديد"} onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="الاسم" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <TextInput label="الهاتف" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <TextInput label="البريد" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <TextInput label={editing ? "كلمة مرور جديدة اختيارية" : "كلمة المرور"} type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <SelectInput label="الدور" value={form.roleId} onChange={(event) => setForm((current) => ({ ...current, roleId: event.target.value }))}>
            {roles.filter((role) => role.name !== "super_admin").map((role) => <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>)}
          </SelectInput>
          <SelectInput label="الفرع" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}>
            <option value="">بدون فرع محدد</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </SelectInput>
          <SelectInput label="الحالة" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserStatus }))}>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">غير نشط</option>
            <option value="INVITED">مدعو</option>
            <option value="DISABLED">معطل</option>
          </SelectInput>
        </div>
        <div className="mt-4 flex gap-2">
          <AppButton onClick={save} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</AppButton>
          <AppButton variant="outline" onClick={() => setOpen(false)}>إلغاء</AppButton>
        </div>
      </Modal>
    </div>
  );
}

function roleLabel(role?: string) {
  if (role === "owner") return "مالك";
  if (role === "manager") return "مدير";
  if (role === "cashier") return "كاشير";
  if (role === "inventory") return "مخزون";
  if (role === "super_admin") return "سوبر أدمن";
  return role ?? "-";
}

function statusLabel(status: UserStatus) {
  return status === "ACTIVE" ? "نشط" : status === "INACTIVE" ? "غير نشط" : status === "INVITED" ? "مدعو" : "معطل";
}

function statusTone(status: UserStatus) {
  return status === "ACTIVE" ? "success" : status === "INVITED" ? "info" : status === "INACTIVE" ? "muted" : "danger";
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
}
