export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: "active" | "inactive" | "pending" | "suspended";
  roles: string[];
  lastLogin?: string;
  createdAt: string;
}
