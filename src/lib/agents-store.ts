/**
 * In-memory agent store used when Postgres is unavailable (local demo).
 * Admin featured toggles persist for the process lifetime.
 */

import { mockAgents, type MockAgent } from "@/data/mock";

export interface DemoAgent extends MockAgent {
  isFeatured: boolean;
  isVerified: boolean;
}

const globalForAgents = globalThis as unknown as {
  nyumbaDemoAgents?: DemoAgent[];
};

function seedAgents(): DemoAgent[] {
  return mockAgents.map((agent, index) => ({
    ...agent,
    // Seed two homepage spots so the section isn't empty until admin edits
    isFeatured: index < 2,
    isVerified: true,
  }));
}

if (!globalForAgents.nyumbaDemoAgents) {
  globalForAgents.nyumbaDemoAgents = seedAgents();
}

export const agentStore = globalForAgents.nyumbaDemoAgents;

export function listDemoAgents() {
  return [...agentStore].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return b.rating - a.rating;
  });
}

export function getFeaturedDemoAgents(limit = 4) {
  return listDemoAgents()
    .filter((a) => a.isFeatured)
    .slice(0, limit);
}

export function getDemoAgent(id: string) {
  return agentStore.find((a) => a.id === id || a.slug === id) ?? null;
}

export function setDemoAgentFeatured(id: string, isFeatured: boolean) {
  const agent = agentStore.find((a) => a.id === id || a.slug === id);
  if (!agent) return null;
  agent.isFeatured = isFeatured;
  return agent;
}

export function setDemoAgentVerified(id: string, isVerified: boolean) {
  const agent = agentStore.find((a) => a.id === id || a.slug === id);
  if (!agent) return null;
  agent.isVerified = isVerified;
  return agent;
}
