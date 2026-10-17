import { TodayView } from "@/views/today";

// Data lives in the browser, so this page renders on the client only.
export const instant = false;

export default function Page() {
  return <TodayView />;
}
