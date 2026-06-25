import { AppNav } from "@/components/AppNav";
import { SiteFooter } from "@/components/legal/SiteFooter";
import type { ReactNode } from "react";

interface PolicyPageProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function PolicyPage({ title, lastUpdated, children }: PolicyPageProps) {
  return (
    <div className="taara-page min-h-screen">
      <AppNav />
      <main className="taara-legal-main">
        <h1 className="taara-heading">{title}</h1>
        {lastUpdated ? <p className="taara-legal-updated">{lastUpdated}</p> : null}
        <div className="taara-legal-body">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
