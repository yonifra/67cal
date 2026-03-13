import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "67Cal - Home Learning Scheduler",
  description: "Create and manage weekly class schedules for remote learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
