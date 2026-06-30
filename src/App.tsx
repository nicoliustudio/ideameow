import React, { useState, useRef, useCallback, useEffect } from 'react';
import EditorPanel from './components/EditorPanel';
import CanvasPanel from './components/CanvasPanel';
import MessageListener from './components/MessageListener';
import SupportModal from './components/SupportModal';
import { Sparkles, X, Chrome, PanelLeft, GripVertical, Settings, Globe, Github, Fish } from 'lucide-react';
import { useStore } from './store';

export default function App() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(35); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const isExtensionConnected = useStore((s) => s.isExtensionConnected);

  const handleDownloadExtension = () => {
    alert(
      "如何在谷歌浏览器 (Google Chrome) 中加载 IdeaMeow 灵感喵插件：\n\n" +
      "1. 请在当前项目右侧的文件资源管理器中找到并下载\u201C/extension/\u201D文件夹到本地目录。\n" +
      "2. 打开 Chrome，并在浏览器搜索栏输入并前往：\u201Cchrome://extensions/\u201D 然后回车。\n" +
      "3. 开启页面右上角的\u201C开发者模式\u201D (Developer mode) 开关。\n" +
      "4. 点击左上角的\u201C加载已解压的扩展程序\u201D (Load unpacked)，并选择刚才下载的\u201Cextension\u201D文件夹即可。"
    );
  };

  // ── Resizable divider drag logic ──
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setEditorWidth(Math.min(Math.max(pct, 18), 55));
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <MessageListener />

      {/* Global Application Nav Header */}
      <header className="h-12 flex items-center justify-between px-5 bg-slate-900/95 border-b border-slate-800/60 shrink-0 select-none z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-[11px] tracking-tighter leading-none select-none">IM</span>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2 leading-none">
            IdeaMeow
            <span className="text-slate-500 font-normal text-[10px]">灵感喵</span>
          </h1>
          <span className="hidden sm:inline text-[10px] text-slate-500 font-medium pl-2 border-l border-slate-700/50">
            本地优先 · 不上传正文
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Plugin status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              isExtensionConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isExtensionConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>{isExtensionConnected ? '插件已连接' : '插件未连接'}</span>
          </div>

          {/* 获取插件 - 主按钮 */}
          <button
            onClick={handleDownloadExtension}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-[11px] font-semibold text-white transition-all cursor-pointer"
          >
            获取插件
          </button>

          {/* 喂点猫粮 - 次按钮 */}
          <button
            onClick={() => setIsSupportOpen(true)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 rounded-full text-[11px] font-semibold transition-all border border-amber-400/20 cursor-pointer flex items-center gap-1"
          >
            <Fish size={12} />
            <span>喂点猫粮</span>
          </button>

          {/* Ghost buttons */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
          >
            <Settings size={11} />
            <span>设置</span>
          </button>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-full text-[11px] font-medium transition-all cursor-pointer"
          >
            手册
          </button>

          <a
            href="https://github.com/nicoliustudio/ideameow"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 no-underline"
          >
            <Github size={11} />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Workspace Panel Matrix */}
      <div ref={containerRef} className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full h-full">

        {/* Left: Editor Panel (resizable + collapsible) */}
        {!editorCollapsed && (
          <section
            style={{ width: `${editorWidth}%`, minWidth: '280px' }}
            className="shrink-0 transition-[width] duration-75"
          >
            <EditorPanel onCollapse={() => setEditorCollapsed(true)} />
          </section>
        )}

        {/* Resizable Divider */}
        {!editorCollapsed && (
          <div
            onMouseDown={handleDividerMouseDown}
            className="w-1.5 bg-transparent hover:bg-blue-500/30 active:bg-blue-500/50 cursor-col-resize shrink-0 transition-colors relative group z-30"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={14} className="text-blue-400" />
            </div>
          </div>
        )}

        {/* Collapsed editor toggle button */}
        {editorCollapsed && (
          <button
            onClick={() => setEditorCollapsed(false)}
            className="shrink-0 w-7 h-full bg-slate-800/60 hover:bg-slate-700/60 flex items-center justify-center cursor-pointer border-r border-slate-700/50 transition-colors group"
            title="展开编辑器"
          >
            <PanelLeft size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>
        )}

        {/* Right: Infinite Canvas */}
        <section className="flex-1 h-full w-full min-w-0">
          <CanvasPanel />
        </section>

        {/* Floating Manual/Guide Modal Overlay */}
        {isGuideOpen && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <Chrome className="text-blue-500" size={20} />
                  <h3 className="font-display font-semibold text-base text-white">
                    Chrome 浏览器收集插件配置指南
                  </h3>
                </div>
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                    插件源文件位置
                  </h4>
                  <p className="leading-relaxed pl-6">
                    我们已在此项目的项目树根目录下为您准备了现成符合 Manifest V3 标准的浏览器插件脚本，位于 <code className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">/extension</code> 文件夹内！包含：
                  </p>
                  <ul className="list-disc pl-11 mt-2 space-y-1 text-slate-400 text-xs">
                    <li><strong className="text-slate-200 font-mono">manifest.json</strong>：注册在 chatgpt.com、kimi.moonshot.cn、www.kimi.com、gemini.google.com、claude.ai 等平台的匹配注入规则。</li>
                    <li><strong className="text-slate-200 font-mono">harvester.js</strong>：注入在网页底层的划词高亮工具菜单，一键快速同步信息。</li>
                    <li><strong className="text-slate-200 font-mono">bridge.js</strong>：实现零延迟安全跨窗口通信的专属信使。</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                    如何在 Chrome / 微软 Edge 中加载安装？
                  </h4>
                  <ol className="list-decimal pl-6 space-y-2 text-slate-400">
                    <li>
                      直接下载当前工作区的整个 <code className="bg-slate-950 text-slate-200 px-1 py-0.5 rounded font-mono text-xs">/extension</code> 根目录至您的本地磁盘。
                    </li>
                    <li>
                      打开 Chrome 并输入地址：<span className="text-blue-400 underline font-mono select-all">chrome://extensions/</span> 然后回车。
                    </li>
                    <li>
                      在扩展程序管理页面右上角，开启 <strong className="text-slate-200">"开发者模式" (Developer mode)</strong> 开关。
                    </li>
                    <li>
                      点击左上角浮现的 <strong className="text-slate-200">"加载已解压的扩展程序" (Load unpacked)</strong> 按钮。
                    </li>
                    <li>
                      在系统文件夹选择器中，定位并选中您下载的 <code className="bg-slate-950 text-slate-200 px-1 py-0.5 rounded font-mono text-xs">extension</code> 文件夹即可。
                    </li>
                  </ol>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-xs text-blue-300 leading-relaxed">
                  <Sparkles size={18} className="shrink-0 mt-0.5 text-blue-400" />
                  <div>
                    <h5 className="font-semibold mb-1">极客级的连接安全与隐私</h5>
                    此消息传递管道仅在您的本工作区域名中激活，且只收集您明确划词后点击了 "Harvest to workspace" 收集的内容。纯客户端与本地数据库运行，零后门无任何云端数据泄露，安全可靠！
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-5 rounded-full transition-all cursor-pointer shadow-md shadow-blue-600/10"
                >
                  我已知晓，开启高能创作
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal - Custom URL Configuration */}
        {isSettingsOpen && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <Globe className="text-blue-500" size={20} />
                  <h3 className="font-display font-semibold text-base text-white">
                    自定义适配网址配置
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
                {/* Built-in sites */}
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    📋 预设支持的 AI 平台
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'ChatGPT', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                      { label: 'Kimi', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                      { label: '豆包', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                      { label: 'DeepSeek', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
                      { label: 'Gemini', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                      { label: 'Claude', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
                    ].map(site => (
                      <span key={site.label} className={`px-3 py-1 rounded-full text-xs font-semibold border ${site.color}`}>
                        {site.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* How to add custom URLs */}
                <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-xl space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-1.5">
                    <Settings size={16} className="text-blue-400" />
                    如何添加自定义网址？
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-300 leading-relaxed">
                    <li>
                      点击 Chrome 工具栏右侧的 <strong className="text-white">IdeaMeow 插件图标</strong>（猫爪）
                    </li>
                    <li>
                      在弹出的设置窗口中，<strong className="text-white">输入你想适配的网址</strong>（支持通配符 *）
                    </li>
                    <li>
                      点击 <strong className="text-white">"添加"</strong> 按钮保存
                    </li>
                    <li>
                      <strong className="text-white">刷新目标网页</strong>，插件即可生效！
                    </li>
                  </ol>
                  <div className="bg-slate-950/60 p-3 rounded-lg font-mono text-xs text-slate-400">
                    <div className="text-slate-500 mb-1">示例：</div>
                    <code className="text-blue-400">*example.com*</code>
                    <span className="text-slate-600 mx-2">—</span>
                    <span>匹配该域名下所有页面</span><br/>
                    <code className="text-blue-400">chat.your-ai.com</code>
                    <span className="text-slate-600 mx-2">—</span>
                    <span>精确匹配特定子域名</span>
                  </div>
                </div>

                {/* Use extension directly */}
                <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex gap-3 text-xs text-slate-300 leading-relaxed">
                  <Chrome size={18} className="shrink-0 mt-0.5 text-blue-400" />
                  <div>
                    <h5 className="font-semibold mb-1">直接通过扩展设置</h5>
                    所有自定义网址保存在 Chrome 同步存储中，登录同一 Google 账号的设备会自动同步。你也可以直接在 Chrome 右上角点击 IdeaMeow 猫爪图标进入设置。
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-5 rounded-full transition-all cursor-pointer shadow-md shadow-blue-600/10"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Modal */}
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      </div>
    </div>
  );
}
