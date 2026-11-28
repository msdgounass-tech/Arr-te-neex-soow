import { AiNav } from "@/components/ai/AiNav";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: { default: "Shoppy AI", template: "%s · Shoppy AI" } };

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white"><Icon name="sparkles" size={22} /></span>
        <div><h1 className="text-2xl font-bold md:text-3xl">Shoppy AI</h1>
          <p className="text-sm text-slate">Votre assistant commercial, branché sur les données réelles de votre boutique.</p></div>
      </header>
      <AiNav />
      {children}
    </div>
  );
}
