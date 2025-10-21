import Image from "next/image";

export function HeroSection() {
  return (
    <>
      <Image
        className="dark:invert"
        src="/next.svg"
        alt="Next.js logo"
        width={180}
        height={38}
        priority
      />
      <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
        <li className="mb-2 tracking-[-.01em]">
          Get started by editing{" "}
          <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
            app/page.tsx
          </code>
          .
        </li>
        <li className="tracking-[-.01em]">Save and see your changes instantly.</li>
      </ol>
    </>
  );
}
