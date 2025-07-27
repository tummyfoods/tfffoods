import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language/LanguageContext";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export function LanguageToggle() {
  const { language, setLanguage, isLoading } = useTranslation();

  return (
    <>
      <LoadingOverlay isVisible={isLoading} />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(language === "en" ? "zh-TW" : "en")}
        className="px-2 font-medium"
        disabled={isLoading}
      >
        {language === "en" ? "中文" : "ENG"}
      </Button>
    </>
  );
}