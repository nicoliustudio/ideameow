import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PlusCircle, HelpCircle, Hand, Maximize2, AlignStartVertical } from 'lucide-react';
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
    isExtensionConnected,
  } = useStore();

  // Tool mode: 'pan' = default 抓手拖动, 'resize' = 自由缩放便签
  const [toolMode, setToolMode] = useState<'pan' | 'resize'>('pan');

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
      <div className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50 animate-pulse" />
            <h3 className="font-sans font-bold text-sm text-slate-100">
              无线灵感素材画布
            </h3>
          </div>
          {/* Tool mode switcher */}
          <div className="flex items-center bg-slate-800 rounded-full p-0.5 border border-slate-700/60">
            <button
              onClick={() => setToolMode('pan')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                toolMode === 'pan'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="抓手模式：拖拽移动便签，滚轮缩放画布"
            >
              <Hand size={11} />
              <span>抓手</span>
            </button>
            <button
              onClick={() => setToolMode('resize')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                toolMode === 'resize'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="缩放模式：拖拽便签四角/边线自由调整宽高"
            >
              <Maximize2 size={11} />
              <span>缩放</span>
            </button>
          </div>
          <span className="text-xs bg-slate-800/60 text-slate-300 px-3 py-1 rounded-full border border-slate-700/60">
            卡片状态：<strong className="text-blue-400 font-mono">{usedCount}</strong> 已用 / <span className="font-mono">{snippets.length}</span> 共计
          </span>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-2">
          {/* Extension connection info widget */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${
              isExtensionConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
            title={
              isExtensionConnected 
                ? 'IdeaMeow 浏览器插件已连接，并可以接收您的任何网页选中文本。' 
                : '插件尚未连接。在 ChatGPT/Kimi/Gemini/Claude 内划词选中并点击 Harvest，卡片会自动同步至此。'
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isExtensionConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : 'bg-amber-500 animate-pulse'}`} />
            <span>{isExtensionConnected ? '浏览器插件已在线' : '插件未连接'}</span>
          </div>

          <button
            onClick={handleCompactLayout}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 rounded-full border border-slate-700 transition-all cursor-pointer shadow-sm shadow-slate-950/20 font-medium"
            title="将所有便签按时间排序、紧凑对齐排列"
          >
            <AlignStartVertical size={13} />
            <span>紧凑排列</span>
          </button>

          <button
            onClick={handleCreateManualSnippet}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 px-3 rounded-full font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
          >
            <PlusCircle size={13} />
            <span>极速便签</span>
          </button>
        </div>
      </div>

      {/* React Flow Stage */}
      <div className="flex-1 w-full relative">
        {snippets.length === 0 ? (
          /* Custom onboarding placeholder widget if no cards exist */
          <div className="absolute inset-x-8 top-12 bottom-12 border border-dashed border-slate-800 bg-slate-900/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center z-10 pointer-events-none select-none backdrop-blur-[2px]">
            <div className="text-6xl mb-4 animate-pulse">🐱💤</div>
            <h4 className="text-slate-100 font-sans font-bold text-base mb-2">
              小猫的游乐场空空如也
            </h4>
            <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
              快去 ChatGPT、Kimi、Gemini 或 Claude 上面抓点灵感回来吧~
            </p>
            <div className="bg-slate-900/90 border border-slate-800/80 px-4 py-3 rounded-xl text-xs text-slate-400 max-w-lg text-left flex gap-3 leading-relaxed shadow-xl">
              <HelpCircle className="text-blue-500 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-slate-200 font-semibold mb-1">如何高效收集创作灵感？</p>
                在任何 AI 文字回答页面或文章资讯网页中划词，选择点击由插件弹出的 <strong>“Harvest”</strong> 快捷悬浮栏，素材将会变成一张张精致的虚拟纸片，零延迟直接平移跳跃至此工作区画布上。
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

      {/* Floating extension link/tips footer */}
      <div className="h-8 border-t border-slate-800 bg-slate-900 px-4 flex items-center justify-between text-[11px] text-slate-400 font-sans tracking-wide shrink-0">
        <span>
          {toolMode === 'pan'
            ? '🖱️ 抓手模式：拖拽便签移动 · 滚轮缩放画布'
            : '📐 缩放模式：拖拽便签四角/边线调整宽高 · 滚轮缩放画布 · 中键拖拽平移'}
        </span>
        <span>本地高速索引技术由 Dexie DB (IndexedDB) 提供原生护航</span>
      </div>
    </div>
  );
}
