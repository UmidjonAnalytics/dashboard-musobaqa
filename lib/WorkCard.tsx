import Link from "next/link";
import { uz } from "./uz";
import { Card, PlatformBadge, PlaceholderTile } from "./ui";
import type { PublicWork } from "./works";

// One entry as it appears in a listing. Shared by the Works gallery and the
// Voting page so the two never drift apart.
export default function WorkCard({
  work,
  footer,
  dimmed,
}: {
  work: PublicWork;
  footer?: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <Card
      className={
        "flex flex-col overflow-hidden transition " +
        (dimmed ? "opacity-55 " : "hover:border-accent/50 hover:shadow-[0_4px_16px_rgba(16,19,25,0.08)] ")
      }
    >
      <Link href={"/ish?id=" + work.id} className="relative block">
        <div className="aspect-[16/10] w-full overflow-hidden bg-mist">
          {work.mainImage ? (
            // A plain img tag on purpose: these come from Supabase Storage
            // and from links students paste, so Next's image optimiser
            // would need every host allow-listed in advance.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={work.mainImage}
              alt={work.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <PlaceholderTile
              competition={work.competition}
              text={uz.platform.noScreenshot}
            />
          )}
        </div>
        <PlatformBadge competition={work.competition} floating />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={"/ish?id=" + work.id}>
          <h2 className="font-bold leading-snug text-ink hover:text-accent">{work.title}</h2>
        </Link>
        {work.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink/55">{work.description}</p>
        ) : null}

        <div className="mt-auto pt-4">
          {footer ? (
            footer
          ) : (
            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link href={"/ish?id=" + work.id} className="text-accent hover:underline">
                {uz.works.open}
              </Link>
              <a href={"/api/download?id=" + work.id} className="text-ink/45 hover:text-ink">
                {uz.works.download}
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
