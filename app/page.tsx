import Dashboard from "@/components/dashboard";
import { getSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = getSupabaseClient();

  const { data: cars, error } = await supabase
    .from("cars_final")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">
            Unable to load the dashboard
          </h1>

          <p className="mt-2 text-zinc-400">
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  return <Dashboard cars={cars ?? []} />;
}