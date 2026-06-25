import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type PolicyNamespace = "terms" | "privacy" | "refund" | "cancellation";

export async function PolicySections({ namespace }: { namespace: PolicyNamespace }) {
  const t = await getTranslations(`legal.${namespace}`);
  const sections = t.raw("sections") as { heading: string; body: string }[];

  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="taara-legal-section">
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </>
  );
}

export function ProseBlock({ children }: { children: ReactNode }) {
  return <div className="taara-legal-prose">{children}</div>;
}
