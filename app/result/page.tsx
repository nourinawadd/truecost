import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { parseResultParams } from "@/lib/resultUrl";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Placeholder until Phase 5: shows what the url carries, after validation.
export default async function ResultPage({ searchParams }: Props) {
  const params = parseResultParams(await searchParams);

  return (
    <>
      <SiteHeader>
        <Link href="/" className="inline-flex min-h-11 items-center">
          [+] CHECK ANOTHER
        </Link>
      </SiteHeader>
      <main className="flex-1 py-10">
        <pre className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
          {JSON.stringify(params, null, 2)}
        </pre>
      </main>
    </>
  );
}
