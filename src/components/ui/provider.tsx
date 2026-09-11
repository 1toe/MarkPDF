import React from "react";
import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

// Custom system: amber as the brand accent (amber-600 = #d97706)
// Reason: warm, distinct from typical SaaS blue, anchors the document/file metaphor.
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: "#fffbeb" },
          100: { value: "#fef3c7" },
          200: { value: "#fde68a" },
          300: { value: "#fcd34d" },
          400: { value: "#fbbf24" },
          500: { value: "#f59e0b" },
          600: { value: "#d97706" },
          700: { value: "#b45309" },
          800: { value: "#92400e" },
          900: { value: "#78350f" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.600}" },
          muted: { value: "{colors.brand.100}" },
          fg:    { value: "{colors.brand.700}" },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

// ThemeProviderProps extends React.PropsWithChildren, but TSC misses it in this module
// resolution context. The cast is safe.
const SafeThemeProvider = ThemeProvider as React.ComponentType<{
  attribute: string;
  disableTransitionOnChange?: boolean;
  children: React.ReactNode;
}>;

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <SafeThemeProvider attribute="class" disableTransitionOnChange>
        {children}
      </SafeThemeProvider>
    </ChakraProvider>
  );
}
