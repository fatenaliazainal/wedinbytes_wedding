import { en } from "./en";
import { ms } from "./ms";

type TranslationValue = string | { readonly [key: string]: TranslationValue };
type TranslationTree = { readonly [key: string]: TranslationValue };
type SupportedLanguage = "ms" | "en";

const translations: Record<SupportedLanguage, TranslationTree> = { en, ms };

function getTranslation(tree: TranslationTree, path: string): string | undefined {
  const value = path.split(".").reduce<TranslationValue | undefined>(
    (current, segment) => (current && typeof current === "object" ? current[segment] : undefined),
    tree,
  );
  return typeof value === "string" ? value : undefined;
}

export function createTranslator(language: SupportedLanguage) {
  return (key: string): string =>
    getTranslation(translations[language], key) ??
    getTranslation(translations.en, key) ??
    "Enter a value";
}