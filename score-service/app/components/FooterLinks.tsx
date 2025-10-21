import Image from "next/image";

import { FOOTER_LINKS } from "../lib/links";

export function FooterLinks() {
  return (
    <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      {FOOTER_LINKS.map(({ href, label, icon }) => (
        <a
          key={href}
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src={icon.src} alt={icon.alt} width={16} height={16} />
          {label}
        </a>
      ))}
    </footer>
  );
}
