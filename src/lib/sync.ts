import { supabase } from "./supabase";
import { useMinka } from "@/store/minka";

// Serialisable slice of the store that we persist to Supabase.
type Snapshot = Pick<
  ReturnType<typeof useMinka.getState>,
  "started" | "areas" | "habits" | "goals" | "tasks" | "blocks" | "logs" | "reviews"
>;

function snapshot(): Snapshot {
  const { started, areas, habits, goals, tasks, blocks, logs, reviews } = useMinka.getState();
  return { started, areas, habits, goals, tasks, blocks, logs, reviews };
}

/** Fetch data from Supabase and hydrate the store. Returns true if data existed. */
export async function loadFromCloud(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("data, lang, theme")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("sync load error", error);
    return false;
  }

  if (data?.data) {
    const snap = data.data as Partial<Snapshot>;
    useMinka.setState({
      started: snap.started ?? false,
      areas: snap.areas ?? [],
      habits: snap.habits ?? [],
      goals: snap.goals ?? [],
      tasks: snap.tasks ?? [],
      blocks: snap.blocks ?? [],
      logs: snap.logs ?? {},
      reviews: snap.reviews ?? [],
      ...(data.lang ? { lang: data.lang as "ar" | "en" } : {}),
      ...(data.theme ? { theme: data.theme as "light" | "dark" } : {}),
    });
    return true;
  }

  // No cloud data yet — push local state up.
  await saveToCloud();
  return false;
}

/** Write current store state to Supabase (upsert). */
export async function saveToCloud(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { lang, theme } = useMinka.getState();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    data: snapshot(),
    lang,
    ...(theme ? { theme } : {}),
  });

  if (error) console.error("sync save error", error);
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

/** Debounced save — call after every mutation when user is logged in. */
export function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToCloud, 1500);
}
