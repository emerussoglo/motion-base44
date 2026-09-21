import { randomUUID } from "crypto";

export type RenderJobStatus = "queued" | "processing" | "completed" | "failed";

export interface RenderJob {
  id: string;
  status: RenderJobStatus;
  createdAt: string;
  updatedAt: string;
  input?: unknown;
  outputPath?: string;
  videoUrl?: string;
  error?: string;
}

class RenderJobStore {
  private jobs = new Map<string, RenderJob>();

  create(input?: unknown): RenderJob {
    const id = randomUUID();
    const now = new Date().toISOString();
    const job: RenderJob = {
      id,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      input,
    };
    this.jobs.set(id, job);
    return job;
  }

  get(id: string): RenderJob | undefined {
    return this.jobs.get(id);
  }

  update(id: string, partial: Partial<RenderJob>): RenderJob | undefined {
    const existing = this.jobs.get(id);
    if (!existing) {
      return undefined;
    }
    const next = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, next);
    return next;
  }

  list(): RenderJob[] {
    return Array.from(this.jobs.values());
  }
}

export const renderJobStore = new RenderJobStore();
