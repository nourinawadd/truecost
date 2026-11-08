import Link from "next/link";
import { ResultView } from "@/components/ResultView";
import { SiteHeader } from "@/components/SiteHeader";
import { parseResultParams } from "@/lib/resultUrl";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ResultPage({ searchParams }: Props) {
  const initial = parseResultParams(await searchParams);

  return (
    <>
      <SiteHeader>
        <Link href="/" className="inline-flex min-h-11 items-center">
          [+] CHECK ANOTHER
        </Link>
      </SiteHeader>
      <ResultView initial={initial} />
    </>
  );
}
