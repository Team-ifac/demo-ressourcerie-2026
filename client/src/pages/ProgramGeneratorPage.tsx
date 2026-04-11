import ProgramGeneratorTool from "@/components/tools/ProgramGeneratorTool";

export default function ProgramGeneratorPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        <section className="rounded-[32px] border border-border/50 bg-background/70 px-8 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
          <div className="max-w-3xl space-y-4">
            <p className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Boîte à outils animation
            </p>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Générateur de programme
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Prépare un programme d’animation à partir de ta semaine type, de
                ton contexte d’encadrement et d’une base riche d’activités.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <ProgramGeneratorTool />
        </section>
      </main>
    </div>
  );
}