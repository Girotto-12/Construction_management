import type { Metadata } from "next";
import { ClientOverview } from "@/components/client-overview";
export const metadata: Metadata = {
  title: "Sua obra · Obra Clara",
  robots: { index: false, follow: false },
};
export default function ClientDemoPage() {
  return <ClientOverview />;
}
