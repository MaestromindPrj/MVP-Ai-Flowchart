import React from "react";
import { notFound } from "next/navigation";
import { ProcessWorkspace } from "@/components/process/ProcessWorkspace";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface ProcessPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProcessPage({ params }: ProcessPageProps) {
  const { id } = await params;
  const process = await prisma.process.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
      },
      participants: {
        orderBy: { createdAt: "asc" },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!process) {
    notFound();
  }

  let activeVersion = process.versions.find(
    (v) => v.id === process.currentVersionId
  );
  if (!activeVersion && process.versions.length > 0) {
    activeVersion = process.versions[0];
  }

  let parsedProcessData = { nodes: [], edges: [] };
  if (activeVersion?.processData) {
    try {
      parsedProcessData = JSON.parse(activeVersion.processData);
    } catch (e) {
      parsedProcessData = { nodes: [], edges: [] };
    }
  }

  const serializedProcess = {
    ...process,
    createdAt: process.createdAt.toISOString(),
    updatedAt: process.updatedAt.toISOString(),
    activeVersion: activeVersion
      ? {
          ...activeVersion,
          createdAt: activeVersion.createdAt.toISOString(),
          processData: parsedProcessData,
        }
      : null,
    processData: parsedProcessData,
    versions: process.versions.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      processData: (() => {
        try {
          return JSON.parse(v.processData);
        } catch {
          return { nodes: [], edges: [] };
        }
      })(),
    })),
    participants: process.participants.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    messages: process.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      suggestedChanges: (() => {
        try {
          return m.suggestedChanges ? JSON.parse(m.suggestedChanges) : [];
        } catch {
          return [];
        }
      })(),
    })),
  };

  return <ProcessWorkspace initialProcess={serializedProcess} />;
}
