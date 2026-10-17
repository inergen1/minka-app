import { AreasView } from "@/views/areas";

// Data lives in the browser, so this page renders on the client only.
export const instant = false;

export default function Page() {
  return <AreasView />;
}
