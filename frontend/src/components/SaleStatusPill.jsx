import { useTranslation } from "react-i18next";

/** @param {{ saleStatus?: string | null, className?: string }} props */
export default function SaleStatusPill({ saleStatus, className = "" }) {
  const { t } = useTranslation();
  const raw = saleStatus || "for_sale";
  const sold = raw === "sold";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] shadow-md ring-1 ring-black/20 ${
        sold ? "bg-stone-700/95 text-parchment/95" : "bg-emerald-700/95 text-parchment"
      } ${className}`}
    >
      {sold ? t("statusSold") : t("statusForSale")}
    </span>
  );
}
