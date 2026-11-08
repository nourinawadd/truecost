import Link from "next/link";
import { ManualEntry } from "@/components/ManualEntry";
import { SiteHeader } from "@/components/SiteHeader";

export default function ManualPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-10 pt-10 pb-16">
        <Link href="/" className="inline-flex min-h-11 items-center self-start text-[13px]">
          [←] back
        </Link>

        <section className="flex flex-col gap-5">
          <h1 className="font-display text-[clamp(28px,6vw,44px)] leading-[1.05] font-medium tracking-[-0.025em]">
            fill it in yourself.
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            type what the shop shows. the math works the same.
          </p>
        </section>

        <ManualEntry />
      </main>
    </>
  );
}
