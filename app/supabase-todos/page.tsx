import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

type TodoRow = {
    id: string | number;
    name: string;
};

export default async function Page() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: todos, error } = await supabase
        .from("todos")
        .select("id, name")
        .order("id", { ascending: true });

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-4 text-xl font-semibold">Supabase Todos</h1>
            {error && (
                <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                    <p className="font-medium">Supabase query failed</p>
                    <p className="mt-1 break-words [overflow-wrap:anywhere]">{error.message}</p>
                    <p className="mt-1 text-xs text-red-200/80">
                        Tip: Create table <span className="font-mono">public.todos (id bigint generated always as identity primary key, name text not null)</span>
                    </p>
                </div>
            )}
            <ul className="space-y-2">
                {(todos as TodoRow[] | null)?.map((todo) => (
                    <li key={todo.id} className="rounded border border-white/10 bg-surface-800 px-3 py-2">
                        {todo.name}
                    </li>
                ))}
            </ul>
        </main>
    );
}
