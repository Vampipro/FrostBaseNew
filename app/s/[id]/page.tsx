"use client";
import { use } from "react";
import ScammerView from "@/components/ScammerView";

export default function ScammerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="page">
      <div className="panel narrow"><ScammerView id={Number(id)} /></div>
    </main>
  );
}
