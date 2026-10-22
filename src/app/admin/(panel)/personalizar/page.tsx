import { obtenerFondoWeb } from "@/lib/ajustes/fondo";
import { FormFondo } from "./form-fondo";
import { guardarFondo } from "./actions";

export const metadata = { title: "Personalizar · Admin" };

type SearchParams = { error?: string; guardado?: string };

export default async function AdminPersonalizarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, guardado } = await searchParams;
  const fondo = await obtenerFondoWeb();

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Personalizar</h1>
      <p className="mt-1 text-sm text-ink-soft">Ajustes visuales que afectan a toda la web.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {guardado && (
        <p className="mt-4 rounded-lg bg-sage/40 px-4 py-3 text-sm text-teal-dark">{guardado}</p>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg text-teal-dark">Fondo de la web</h2>
        <p className="mt-1 text-sm text-ink-soft">
          La capa que se ve detrás de las tarjetas blancas en todas las páginas.
        </p>
        <FormFondo inicial={fondo} action={guardarFondo} />
      </section>
    </div>
  );
}
