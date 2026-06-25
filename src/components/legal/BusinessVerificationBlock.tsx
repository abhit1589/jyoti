import { getBusinessDetails } from "@/lib/business/config";
import { getTranslations } from "next-intl/server";

export async function BusinessVerificationBlock() {
  const business = getBusinessDetails();
  const t = await getTranslations("legal.about");

  return (
    <section className="taara-legal-card" aria-labelledby="merchant-verification">
      <h2 id="merchant-verification" className="taara-legal-card-title">
        {t("verificationTitle")}
      </h2>
      <dl className="taara-legal-dl">
        <div>
          <dt>{t("legalNameLabel")}</dt>
          <dd>{business.legalName}</dd>
        </div>
        <div>
          <dt>{t("proprietorNameLabel")}</dt>
          <dd>{business.proprietorName}</dd>
        </div>
        <div>
          <dt>{t("addressLabel")}</dt>
          <dd>
            {business.aadhaarAddress || (
              <span className="taara-legal-muted">{t("addressMissing")}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>{t("emailLabel")}</dt>
          <dd>
            <a href={`mailto:${business.email}`}>{business.email}</a>
          </dd>
        </div>
        {business.phone ? (
          <div>
            <dt>{t("phoneLabel")}</dt>
            <dd>
              <a href={`tel:${business.phone}`}>{business.phone}</a>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{t("websiteLabel")}</dt>
          <dd>
            <a href={business.website}>{business.website.replace("https://", "")}</a>
          </dd>
        </div>
      </dl>
    </section>
  );
}
