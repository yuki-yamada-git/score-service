export type CtaLink = {
  href: string;
  label: string;
  icon?: {
    src: string;
    alt: string;
  };
  variant: "primary" | "secondary";
};

export type FooterLink = {
  href: string;
  label: string;
  icon: {
    src: string;
    alt: string;
  };
};

export const CTA_LINKS: CtaLink[] = [
  {
    href: "https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
    label: "Deploy now",
    icon: {
      src: "/vercel.svg",
      alt: "Vercel logomark",
    },
    variant: "primary",
  },
  {
    href: "https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
    label: "Read our docs",
    variant: "secondary",
  },
];

export const FOOTER_LINKS: FooterLink[] = [
  {
    href: "https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
    label: "Learn",
    icon: {
      src: "/file.svg",
      alt: "File icon",
    },
  },
  {
    href: "https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
    label: "Examples",
    icon: {
      src: "/window.svg",
      alt: "Window icon",
    },
  },
  {
    href: "https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
    label: "Go to nextjs.org →",
    icon: {
      src: "/globe.svg",
      alt: "Globe icon",
    },
  },
];
