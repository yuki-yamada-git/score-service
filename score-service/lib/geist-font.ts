interface GeistOptions {
  /** Name of the CSS custom property assigned to the font. */
  variable?: string;
}

interface GeistFont {
  className: string;
  variable: string;
  style: {
    fontFamily: string;
  };
}

const createFont = (className: string, defaultVariable: string): ((options?: GeistOptions) => GeistFont) => {
  return (options = {}) => {
    const variableName = options.variable ?? defaultVariable;

    return {
      className,
      variable: className,
      style: {
        fontFamily: `var(${variableName})`,
      },
    };
  };
};

export const Geist = createFont("font-geist-sans", "--font-geist-sans");
export const Geist_Mono = createFont("font-geist-mono", "--font-geist-mono");
