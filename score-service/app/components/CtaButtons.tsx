import Image from "next/image";

import { CTA_LINKS } from "../lib/links";

type VariantStyles = {
  [key in (typeof CTA_LINKS)[number]["variant"]]: string;
};

const VARIANT_CLASSES: VariantStyles = {
  primary:
    "rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto",
  secondary:
    "rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]",
};

export function CtaButtons() {
  return (
    <div className="flex gap-4 items-center flex-col sm:flex-row">
      {CTA_LINKS.map(({ href, label, icon, variant }) => (
        <a
          key={href}
          className={VARIANT_CLASSES[variant]}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {icon ? (
            <Image
              className="dark:invert"
              src={icon.src}
              alt={icon.alt}
              width={20}
              height={20}
            />
          ) : null}
          {label}
        </a>
      ))}
    </div>
  );
}
