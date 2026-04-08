export default function UserProfile() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Page en attente
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Mon profil
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Cette page profil correspond à une ancienne version du projet.
            Elle n’est pas branchée dans l’application actuelle et a été
            neutralisée proprement pour supprimer les erreurs techniques sans
            créer de régression.
          </p>
        </div>
      </main>
    </div>
  );
}