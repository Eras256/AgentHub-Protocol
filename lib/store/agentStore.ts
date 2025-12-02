import { create } from "zustand";

interface Agent {
  address: string;
  agentId: string;
  trustScore: number;
  stakedAmount: string;
  isActive: boolean;
}

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  setAgents: (agents: Agent[]) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (address: string, updates: Partial<Agent>) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  setAgents: (agents) => set({ agents }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  addAgent: (agent) =>
    set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (address, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.address === address ? { ...agent, ...updates } : agent
      ),
    })),
}));

