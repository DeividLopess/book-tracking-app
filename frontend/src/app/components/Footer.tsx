import { ArrowUp } from "lucide-react";
import { getTranslation, type Language } from "../i18n";

type FooterProps = {
  language: Language;
};

export function Footer({ language }: FooterProps) {
  const t = getTranslation(language);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <div className="text-center text-xs text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} {t.appTitle}
        </div>

        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2 rounded-full border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-accent"
        >
          <ArrowUp size={18} />
          {t.footer.backToTop}
        </button>
      </div>
    </footer>
  );
}