import type { Metadata } from "next";
import { CartExperience } from "./cart-experience";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review campus orders, apply a coupon and check the order total.",
};

export default function CartPage() {
  return <CartExperience />;
}
