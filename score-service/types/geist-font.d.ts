declare module "geist/font" {
  interface GeistOptions {
    /**
     * Name of the CSS custom property exposed by the font.
     */
    variable?: string;
  }

  interface GeistFont {
    /** CSS class name that applies the font family. */
    className: string;
    /** CSS variable that Tailwind can consume. */
    variable: string;
    /** Inline style helper exposed by Next.js font loaders. */
    style: {
      fontFamily: string;
    };
  }

  export function Geist(options?: GeistOptions): GeistFont;
  export function Geist_Mono(options?: GeistOptions): GeistFont;
}
