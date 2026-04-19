import Image from "next/image";

type CategoryHeroProps = {
  name: string;
  description?: string;
  imageUrl?: string;
};

export function CategoryHero({ name, description, imageUrl }: CategoryHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
      <div className="relative aspect-[21/9] min-h-[200px] w-full bg-slate-900 md:min-h-[260px]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Visuel de la catégorie ${name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-primary/30" />
        )}
        <div
          className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Catégorie</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-4xl">
            {name}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">{description}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
