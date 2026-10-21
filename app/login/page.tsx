import type { Metadata } from "next";
import { LoginExperience } from "./login-experience";

export const metadata: Metadata = {
  title: "Sign in or create an account",
  description: "Secure sign-in for students, faculty and campus guests.",
};

export default function LoginPage() {
  return <LoginExperience />;
}
