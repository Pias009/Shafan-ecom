"use client";

interface TamaraWidgetProps {
  price: number | string;
  currency: string;
  country?: string;
  widgetType?: "product" | "cart" | "summary";
}

export default function TamaraWidget({ price, currency, country = "AE", widgetType = "summary" }: TamaraWidgetProps) {
  const amount = Number(price);
  if (isNaN(amount) || amount <= 0) return null;

  const installment = amount / 4;
  const isKWD = currency.toUpperCase() === "KWD";
  const formattedInstallment = installment.toFixed(isKWD ? 3 : 2);

  return (
    <div className="my-4 w-full">
      <div className="bg-gray-50 border border-black/10 rounded-lg flex flex-row items-center justify-between p-3 md:p-4 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs font-bold text-gray-800 leading-tight">
            Split your purchase into 4 interest-free payments of {formattedInstallment} {currency.toUpperCase()}
          </span>
        </div>
        <img 
          src="https://cdn.tamara.co/assets/svg/tamara-logo-en.svg" 
          alt="Tamara" 
          className="h-5 md:h-6 shrink-0" 
        />
      </div>
    </div>
  );
}
