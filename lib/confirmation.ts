export type ConfirmationKind = "event" | "fest" | "order" | "host" | "stall";
export type ConfirmationStatus = "preview" | "submitted" | "request-ready";

export type ConfirmationDraft = {
  kind: ConfirmationKind;
  status: ConfirmationStatus;
  reference: string;
  createdAt: string;
  name: string;
  email?: string;
  phone?: string;
  collegeId?: string;
  image?: string;
  title: string;
  subtitle?: string;
  date?: string;
  location?: string;
  people?: string[];
  participants?: { name: string; image?: string; reference: string }[];
  items?: { name: string; quantity: number; total: number }[];
  amount?: number;
  pricing?: { subtotal: number; discount: number; platformFee: number; gatewayFeeWithGst: number; total: number };
};

export const confirmationStorageKey = "collexus-confirmation-draft-v1";

export function storeConfirmation(draft: ConfirmationDraft) {
  window.sessionStorage.setItem(confirmationStorageKey, JSON.stringify(draft));
}
