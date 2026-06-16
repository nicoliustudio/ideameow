import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Trash2, CheckCircle2, RotateCcw, AlertCircle, Send, GripHorizontal, Copy } from 'lucide-react';
import { useStore } from '../store';
import type { DBSnippet } from '../db';

interface SnippetNodeProps {
  id: string;
  data: {
    snippet: DBSnippet;
  };
}

export default function SnippetNode({ id: nodeId, data }: SnippetNodeProps) {
  const { snippet } = data;
  const { deleteSnippet, markAsUsed, markAsUnread, requestInsertText } = useStore();
  const [selectedText, setSelectedText] = useState('');
  const [showSendBtn, setShowSendBtn] = useState(false);
  const [copiedHint, setCopiedHint] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!snippet) {
    return (
      <div className="p-4 bg-red-950 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
        <AlertCircle size={16} />
        <span>同步素材包已损坏</span>
      </div>
    );
  }

  const isUsed = snippet.status === 'used';

  // Vendor color configurations
  const sourceConfigs: Record<string, { name: string; color: string; badge: string; lineBg: string }> = {
    chatgpt: {
      name: 'ChatGPT 平台',
      color: 'text-emerald-400',
      badge: 'bg-emerald-500',
      lineBg: 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
    },
    kimi: {
      name: 'Kimi 工作台',
      color: 'text-orange-400',
      badge: 'bg-orange-500',
      lineBg: 'bg-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
    },
    gemini: {
      name: '谷歌 Gemini',
      color: 'text-blue-400',
      badge: 'bg-blue-400',
      lineBg: 'bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.3)]'
    },
    claude: {
      name: 'Claude AI 智囊',
      color: 'text-purple-400',
      badge: 'bg-purple-500',
      lineBg: 'bg-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
    },
    doubao: {
      name: '豆包 AI',
      color: 'text-green-400',
      badge: 'bg-green-500',
      lineBg: 'bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
    },
    deepseek: {
      name: 'DeepSeek',
      color: 'text-cyan-400',
      badge: 'bg-cyan-500',
      lineBg: 'bg-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
    },
    other: {
      name: '快捷灵感便签',
      color: 'text-slate-400',
      badge: 'bg-slate-500',
      lineBg: 'bg-slate-500/80'
    }
  };

  const config = sourceConfigs[snippet.source] || sourceConfigs.other;

  // Convert timestamp
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ── Global document-level mouseup to detect text selection ──
  // React Flow captures mouse events on nodes, so we hook into document instead.
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Small delay to let the selection object settle
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';

        // Check if the selection's anchor node is inside OUR card
        if (
          text &&
          contentRef.current &&
          selection &&
          selection.anchorNode &&
          contentRef.current.contains(selection.anchorNode)
        ) {
          setSelectedText(text);
          setShowSendBtn(true);
        } else {
          // Only hide if the click was NOT on the send button
          setShowSendBtn(false);
          setSelectedText('');
        }
      }, 10);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Send selected text to editor cursor position
  const handleSendSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (selectedText) {
        requestInsertText(selectedText);
        setShowSendBtn(false);
        setSelectedText('');
        // Clear browser selection
        window.getSelection()?.removeAllRanges();
      }
    },
    [selectedText, requestInsertText]
  );

  // Copy selected text to clipboard (fallback for users)
  const handleCopySelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
          setCopiedHint(true);
          setTimeout(() => setCopiedHint(false), 1500);
        }).catch(() => {
          // Fallback for older browsers
          const ta = document.createElement('textarea');
          ta.value = selectedText;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setCopiedHint(true);
          setTimeout(() => setCopiedHint(false), 1500);
        });
      }
    },
    [selectedText]
  );

  // ALSO support native Ctrl+C — the text is select-text, so it works.
  // We just need to make sure the card doesn't interfere with the keyboard event.

  return (
    <div
      id={`node-snippet-${snippet.id}`}
      className="relative group w-[300px] h-auto bg-slate-900 border border-slate-800/80 rounded-xl shadow-xl pointer-events-auto overflow-visible hover:border-slate-700/80 hover:shadow-2xl"
    >
      <NodeResizer
        minWidth={220}
        minHeight={120}
        handleStyle={{
          width: 14,
          height: 14,
          borderRadius: 3,
          backgroundColor: '#64748b',
          border: '2px solid #cbd5e1',
        }}
        lineStyle={{ borderColor: 'transparent' }}
      />
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />

      {/* Top colored accent line */}
      <div className={`h-1.5 ${config.lineBg} w-full`} />

      {/* Header: drag handle + meta + actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center gap-2">
          {/* Drag Handle — only this element triggers canvas panning */}
          <span
            className="sf-drag-handle flex items-center justify-center w-5 h-5 rounded hover:bg-slate-700/60 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="拖拽移动卡片"
          >
            <GripHorizontal size={12} />
          </span>

          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
            {config.name}
          </span>
          <span className="font-mono text-[9px] text-slate-500 font-medium">
            {formatTime(snippet.timestamp)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {isUsed ? (
            <button
              onClick={() => markAsUnread(snippet.id)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-full transition-colors"
              title="标记为未整理"
            >
              <RotateCcw size={12} />
            </button>
          ) : (
            <button
              onClick={() => markAsUsed(snippet.id, snippet.content)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-full transition-colors"
              title="标记为已用"
            >
              <CheckCircle2 size={12} />
            </button>
          )}
          <button
            onClick={() => deleteSnippet(snippet.id)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-full transition-colors"
            title="删除此素材"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content Zone — NOT draggable, freely selectable & copyable */}
      <div
        ref={contentRef}
        className="p-4 text-slate-200 hover:text-white transition-colors relative"
      >
        <div
          className="text-xs text-slate-300 leading-relaxed font-sans block p-2 select-text"
          style={{ userSelect: 'text', WebkitUserSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {snippet.content}
        </div>

        {/* Floating action bar when text is selected */}
        {showSendBtn && selectedText && (
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-50 animate-fade-in"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-full px-1 py-1 shadow-2xl">
              <button
                onClick={handleSendSelection}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                title="将选中文本发送到剧本编辑器光标处"
              >
                <Send size={9} />
                <span>发送到编辑器</span>
              </button>
              <button
                onClick={handleCopySelection}
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold py-1 px-2.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                title="复制选中文本到剪贴板"
              >
                <Copy size={9} />
                <span>{copiedHint ? '已复制!' : '复制'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* USED overlay mask */}
      {isUsed && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1.5px] flex flex-col items-center justify-center animate-fade-in transition-all rounded-xl">
          <div className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-semibold shadow-lg">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>已成功并入剧本段落</span>
          </div>
          <button
            onClick={() => markAsUnread(snippet.id)}
            className="mt-2 text-[10px] font-sans text-slate-500 hover:text-slate-300 underline cursor-pointer"
          >
            撤回至灵感池
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}
