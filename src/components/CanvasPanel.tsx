import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PlusCircle, Hand, Maximize2, AlignStartVertical, Trash2, MoreHorizontal } from 'lucide-react';
import { useStore } from '../store';
import SnippetNode from './SnippetNode';

const nodeTypes = {
  snippetNode: SnippetNode,
};

export default function CanvasPanel() {
  const {
    snippets,
    loadSnippets,
    addSnippet,
    updateSnippetPosition,
    clearAllSnippets,
  } = useStore();

  const [toolMode, setToolMode] = useState<'pan' | 'resize'>('pan');
  const [menuOpen, setMenuOpen] = useState(false);

  // Load initial database list upon page load
  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  // Convert schema snippets list directly to React Flow interactive nodes
  const flowNodes = useMemo(() => {
    const isResize = toolMode === 'resize';
    return snippets.map((snippet) => ({
      id: snippet.id,
      type: 'snippetNode',
      position: snippet.position || { x: 100, y: 100 },
      data: { snippet, resizeMode: isResize },
      style: { width: 300, height: 160 },
      // 仅在抓手模式下启用拖拽；缩放模式下禁用 dragHandle
      dragHandle: isResize ? undefined : '.sf-drag-handle',
    }));
  }, [snippets, toolMode]);

  // Capture position update at node dragging end and persist to Dexie database
  const handleNodeDragStop = useCallback(
    (_event: any, node: any) => {
      if (node.position) {
        updateSnippetPosition(node.id, node.position.x, node.position.y);
      }
    },
    [updateSnippetPosition]
  );

  // Compact flow layout: single row, infinite horizontal scroll
  const handleCompactLayout = useCallback(() => {
    const startX = 60;
    const startY = 80;
    const gap = 24;

    const sorted = [...snippets].sort((a, b) => a.timestamp - b.timestamp);

    sorted.forEach((snippet, index) => {
      updateSnippetPosition(
        snippet.id,
        startX + index * (300 + gap),
        startY
      );
    });
  }, [snippets, updateSnippetPosition]);

  // Clear all sticky notes from the canvas (with confirmation)
  const handleClearAll = useCallback(() => {
    if (snippets.length === 0) return;
    if (window.confirm('确定要清空画布中的全部便签吗？此操作不可撤销。')) {
      clearAllSnippets();
    }
  }, [snippets.length, clearAllSnippets]);

  // Formulates a manual card inside workspace
  const handleCreateManualSnippet = useCallback(() => {
    const randomIdea = prompt('Enter a custom text snippet or note:')?.trim();
    if (!randomIdea) return;

    addSnippet({
      id: `manual-${Date.now()}`,
      source: 'other',
      content: randomIdea,
      timestamp: Date.now(),
      status: 'unread',
      position: {
        x: Math.random() * 200 + 150,
        y: Math.random() * 200 + 150,
      },
    });
  }, [addSnippet]);

  const usedCount = useMemo(() => {
    return snippets.filter((s) => s.status === 'used').length;
  }, [snippets]);

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden flex flex-col">
      {/* Canvas Controls Header */}
      <div className="h-11 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          <h3 className="font-sans font-bold text-sm text-slate-200">
            无限灵感画布
          </h3>
          <span className="text-[11px] text-slate-400">
            {snippets.length} 条灵感 · {usedCount} 条已用
          </span>
          {/* Tool mode switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-full p-0.5 border border-slate-700/40">
            <button
              onClick={() => setToolMode('pan')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                toolMode === 'pan'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="拖拽移动便签"
            >
              <Hand size={11} />
              <span>抓手</span>
            </button>
            <button
              onClick={() => setToolMode('resize')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                toolMode === 'resize'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="自由调整便签大小"
            >
              <Maximize2 size={11} />
              <span>缩放</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateManualSnippet}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 px-3 rounded-full font-semibold transition-all cursor-pointer"
          >
            <PlusCircle size={12} />
            <span>新便签</span>
          </button>

          <button
            onClick={handleCompactLayout}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-3 rounded-full border border-slate-700/60 transition-all cursor-pointer"
            title="整理便签布局"
          >
            <AlignStartVertical size={12} />
            <span>整理</span>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2.5 rounded-full border border-slate-700/60 transition-all cursor-pointer"
              title="更多操作"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
                <button
                  onClick={() => { handleClearAll(); setMenuOpen(false); }}
                  disabled={snippets.length === 0}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} />
                  清空画布
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* React Flow Stage */}
      <div className="flex-1 w-full relative">
        {snippets.length === 0 ? (
          /* 3-step onboarding card */
          <div className="absolute inset-x-8 top-10 bottom-10 border border-dashed border-slate-800 bg-slate-900/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center z-10 pointer-events-none select-none backdrop-blur-[2px]">
            <div className="text-5xl mb-3">🐱</div>
            <h4 className="text-slate-200 font-sans font-bold text-base mb-1">
              小猫还没叼回灵感
            </h4>
            <p className="text-slate-500 text-xs mb-5">三步开始：</p>
            <div className="space-y-3 text-xs text-slate-400 max-w-sm text-left mb-5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-px">1</span>
                <span>安装浏览器插件</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-px">2</span>
                <span>去 ChatGPT / Kimi / Gemini / Claude 划词</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-px">3</span>
                <span>点击「喵一下」，灵感会自动飞进这里</span>
              </div>
            </div>
          </div>
        ) : null}

        <ReactFlow
          nodes={flowNodes}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          nodesDraggable={toolMode === 'pan'}
          nodesConnectable={false}
          nodesFocusable={toolMode === 'pan'}
          panOnDrag={toolMode === 'pan' ? true : [1]}
          panOnScroll={true}
          selectNodesOnDrag={false}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          className="bg-slate-950"
        >
          {/* Visual canvas layout cues matching the Sleek layout specs */}
          <Background color="#1e293b" gap={30} size={1.2} />
          <Controls className="bg-slate-900 border border-slate-850 text-slate-400 [&_button]:border-b-slate-800 hover:[&_button]:bg-slate-800 text-xs rounded-lg overflow-hidden shrink-0 shadow-2xl" />
        </ReactFlow>
      </div>

      {/* Footer */}
      <div className="h-7 border-t border-slate-800/60 bg-slate-900/80 px-4 flex items-center justify-between text-[10px] text-slate-500 font-sans tracking-wide shrink-0">
        <span>
          {toolMode === 'pan'
            ? '拖拽移动便签 · 滚轮缩放画布'
            : '拖拽边角调整大小 · 中键拖拽平移'}
        </span>
        <span>本地保存 · 不上传正文</span>
      </div>
    </div>
  );
}
