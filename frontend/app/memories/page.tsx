"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeChange,
} from "reactflow";
import "reactflow/dist/base.css";

const POSITIONS_KEY = "memoria-graph-positions";

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [history, setHistory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Save positions whenever nodes are dragged
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // After applying changes, persist positions
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
        const [graphRes, historyRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/graph", {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
          }),
          fetch(`http://127.0.0.1:8000/history?t=${Date.now()}`, {
            cache: "no-store",
            }),
        ]);

        if (graphRes.ok) {
          const data = await graphRes.json();
          const rawNodes = data.nodes || [];
          const rawEdges = data.edges || [];

          // Load saved positions from localStorage
          const savedPositions = loadSavedPositions();

          // Arrange new nodes in a circle so initial layout is deterministic
          const cx = 500, cy = 300, radius = 250;
          const flowNodes: Node[] = rawNodes.map((n: any, i: number) => {
            const id = String(n.id ?? `n${i}`);
            const label = n.label || id;
            // Use saved position if exists, otherwise place on circle
            const angle = (2 * Math.PI * i) / rawNodes.length;
            const defaultPos = {
              x: cx + radius * Math.cos(angle),
              y: cy + radius * Math.sin(angle),
            };
            return {
              id,
              data: { label },
              position: savedPositions[id] ?? defaultPos,
              style: {
                background: "#4f46e5",
                color: "white",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
              style: { stroke: "#1e40af", strokeWidth: 5, strokeOpacity: 0.95 },
              markerEnd: { type: "arrowclosed" as const, color: "#1e40af" },
            }];
          });

          setNodes(flowNodes);
          setEdges(flowEdges);
        }

        if (historyRes.ok) {
          const h = await historyRes.json();
          
          // Get the raw string inside the array
          const rawString = Array.isArray(h.history) ? h.history[0] : (h.history || "");
          
          // Use Regex to pull out exactly what's inside text="..."
          const match = rawString.match(/text="([^"\\]*(?:\\.[^"\\]*)*)"/);
          
          if (match && match[1]) {
            // If we found the clean text, save it to state
            setHistory(match[1]);
          } else if (rawString && !rawString.includes("kind='graph_completion'")) {
            // Fallback if the backend suddenly sends a normal clean string
            setHistory(rawString);
          } else {
            setHistory("No core memory snapshot extracted yet.");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [setNodes, setEdges]);

  if (loading) return <div className="p-10 text-center">Loading Graph...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4 bg-white border-b flex justify-between items-center">
        <Link href="/" className="text-indigo-600 font-medium">← Back</Link>
        <h1 className="text-2xl font-bold">Memory Graph</h1>
        <div className="text-sm text-slate-500">Drag nodes • Scroll to zoom</div>
      </header>

      <div style={{ width: "100%", height: "calc(100vh - 180px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          style={{ background: "#f8fafc" }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <div className="p-6 max-w-4xl mx-auto bg-white border-t w-full">
        <h2 className="font-bold text-lg mb-4">Core Profile Memory Summary</h2>
        {!history ? (
          <p className="text-slate-400">No core memory snapshot extracted yet.</p>
        ) : (
          <div className="mb-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-950 text-base leading-relaxed shadow-sm">
            {history}
          </div>
        )}
      </div>
    </div>
  );
}