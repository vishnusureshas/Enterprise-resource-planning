export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  roles: string[];
  lastLogin?: string;
  createdAt: string;
}
