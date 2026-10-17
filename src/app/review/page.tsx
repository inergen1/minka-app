import { ReviewView } from "@/views/review";

// Data lives in the browser, so this page renders on the client only.
export const instant = false;

export default function Page() {
  return <ReviewView />;
}
