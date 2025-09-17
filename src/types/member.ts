export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  packageId: string;
  joinDate: string;
  expiryDate: string;
  status: "active" | "inactive";
}
