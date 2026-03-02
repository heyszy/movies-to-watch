import Image from "next/image";

import type { MovieCreditsResponse } from "@/shared/lib/movie-detail-adapter";

interface MovieCreditPanelProps {
  credits: MovieCreditsResponse | null;
  errorMessage?: string;
}

function CreditError({ message }: { message: string }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-3xl font-bold text-slate-900">演员阵容</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>
    </section>
  );
}

function CastPhoto({
  name,
  profileUrl,
}: {
  name: string;
  profileUrl: string | null;
}) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-slate-100">
      {profileUrl ? (
        <Image
          src={profileUrl}
          alt={`${name} 演员照片`}
          fill
          sizes="(max-width: 768px) 40vw, 180px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium tracking-wide text-slate-500">
          暂无照片
        </div>
      )}
    </div>
  );
}

export function MovieCreditPanel({
  credits,
  errorMessage,
}: MovieCreditPanelProps) {
  if (errorMessage) {
    return <CreditError message={errorMessage} />;
  }

  if (!credits) {
    return <CreditError message="暂无演职员信息。" />;
  }

  /**
   * 演员区使用横向滚动，方便完整展示头像与名称而不压缩信息。
   */
  const cast = [...credits.cast].sort((a, b) => a.order - b.order).slice(0, 20);

  return (
    <section>
      <h2 className="text-3xl font-bold text-slate-900">演员阵容</h2>
      {cast.length > 0 ? (
        <div className="mt-5 overflow-x-auto pb-2">
          <ul className="flex min-w-max gap-4">
            {cast.map((actor) => (
              <li
                key={actor.id}
                className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <CastPhoto name={actor.name} profileUrl={actor.profileUrl} />
                <div className="px-3 py-3">
                  <p className="line-clamp-2 text-base font-semibold text-slate-900">
                    {actor.name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">暂无演员信息。</p>
      )}
    </section>
  );
}
