"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeChange,
  MarkerType,
} from "reactflow";
import "reactflow/dist/base.css";
import { api } from "@/src/api";
import Header from "@/src/components/Header";

const POSITIONS_KEY = "memoria-graph-positions";

// Same pastel palette as the landing page's feature badges — nodes read as
// little memory cards rather than generic graph-tool boxes.
const PALETTE = [
  { bg: "#FFE1EE", text: "#A6265E" },
  { bg: "#D1FADF", text: "#245E33" },
  { bg: "#E0F2F1", text: "#2E7D32" },
];

function loadSavedPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePositions(nodes: Node[]) {
  try {
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => { positions[n.id] = n.position; });
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  } catch {}
}

export default function MemoriesPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [history, setHistory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    api.logout();
    router.push("/login");
  };

  // Save positions whenever nodes are dragged
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      setNodes((current: Node[]) => {
        savePositions(current);
        return current;
      });
    },
    [onNodesChange, setNodes]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const [graphData, historyData] = await Promise.all([
          api.getGraph().catch(() => null),
          api.getHistory().catch(() => null),
        ]);

        if (graphData) {
          const rawNodes = graphData.nodes || [];
          const rawEdges = graphData.edges || [];
          const savedPositions = loadSavedPositions();

          // Arrange new nodes in a circle so initial layout is deterministic
          const cx = 500, cy = 300, radius = 250;
          const flowNodes: Node[] = rawNodes.map((n: any, i: number) => {
            const id = String(n.id ?? `n${i}`);
            const label = n.label || id;
            const angle = (2 * Math.PI * i) / rawNodes.length;
            const defaultPos = {
              x: cx + radius * Math.cos(angle),
              y: cy + radius * Math.sin(angle),
            };
            const colors = PALETTE[i % PALETTE.length];
            return {
              id,
              data: { label },
              position: savedPositions[id] ?? defaultPos,
              style: {
                background: colors.bg,
                color: colors.text,
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 12,
                padding: "10px 16px",
                fontSize: "13px",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              },
            };
          });

          const flowEdges: Edge[] = rawEdges.flatMap((e: any, i: number) => {
            const source = String(e.source ?? e.from ?? "");
            const target = String(e.target ?? e.to ?? "");
            if (!source || !target) return [];
            return [{
              id: `e${i}`,
              source,
              target,
              label: e.label || undefined,
              style: { stroke: "#16787C", strokeWidth: 2.5, strokeOpacity: 0.9 },
              labelStyle: { fill: "#16787C", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 11 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#16787C" },
            }];
          });

          setNodes(flowNodes);
          setEdges(flowEdges);
        }

        if (historyData) {
          // FIX: previously did `h.history[0]` — only the first memory
          // snapshot was ever shown, the rest of the returned list was
          // silently dropped. Also dropped the fragile client-side regex
          // that re-parsed a raw Cognee object string — the backend's
          // /history endpoint already returns clean text, so this just
          // uses it directly.
          const entries = Array.isArray(historyData.history)
            ? historyData.history.filter(Boolean)
            : historyData.history
              ? [historyData.history]
              : [];
          setHistory(entries.join("\n\n"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [setNodes, setEdges]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F6F6] font-serif">
        <p className="text-gray-400 text-sm font-sans animate-pulse">Loading your memory graph...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] flex flex-col font-serif">
      <Header/>

      <div className="w-full h-[65vh] min-h-[420px] relative">
        <h1 className="fraunces text-3xl p-4 pb-4 text-center text-[#111111] hidden sm:block">Your memory, visualized</h1>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          style={{ background: "#F6F6F6" }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
          }}
        >
          <Background color="#d8ddd9" gap={24} />
          <Controls />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 font-sans text-sm text-center max-w-xs px-4">
              Nothing to map yet — keep chatting in your diary and Memoria will start connecting the dots.
            </p>
          </div>
        )}
      </div>

      {/* Core memory summary, styled as a notebook page — same motif as the login card */}
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
        <h2 className="fraunces text-2xl text-[#111111] mb-1">Core memory</h2>
        <p className="indie-flower-regular text-base text-gray-500 mb-6 lowercase italic">
          the story so far, in one place
        </p>

        <div className="relative bg-[#FFFDF8] rounded-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden">
          <div className="absolute top-0 bottom-0 left-10 w-px bg-rose-300/50 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(20,138,143,0.12) 32px)",
              backgroundPosition: "0 40px",
            }}
          />
          <div className="relative px-8 py-8 pl-14 font-sans text-[15px] leading-relaxed text-gray-800">
            {!history ? (
              <p className="text-gray-400 italic">
                No core memory snapshot extracted yet — keep chatting in your diary and Memoria will start piecing this together.
              </p>
            ) : (
              <p className="whitespace-pre-wrap">{history}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}