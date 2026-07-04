export type AuthenticatedUser = {
  id: string;
  storeId: string | null;
  branchId: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
  isSuperAdmin: boolean;
  name: string;
  email: string | null;
  phone: string | null;
};
