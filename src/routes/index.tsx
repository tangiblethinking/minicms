import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/shell/Shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Shell />;
}
