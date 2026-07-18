export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
}
