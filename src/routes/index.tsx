import { createFileRoute } from "@tanstack/react-router";
import { GastroApp } from "@/components/gastrolink/gastro-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GastroApp />;
}
