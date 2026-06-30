import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Download,
  Lock,
  Image,
  PanelRightClose
} from 'lucide-react';
import { useStore } from '../store';

// Helper to translate rich editor HTML content into highly clean Markdown
function htmlToMarkdown(html: string): string {
  let doc = document.createElement('div');
  doc.innerHTML = html;

  // Simple direct translation rules
  const translateNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    let childrenContent = Array.from(element.childNodes)
      .map(translateNode)
      .join('');

    switch (tagName) {
      case 'h1':
        return `\n# ${childrenContent.trim()}\n\n`;
      case 'h2':
        return `\n## ${childrenContent.trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenContent}**`;
      case 'em':
      case 'i':
        return `*${childrenContent}*`;
      case 'strike':
      case 's':
      case 'del':
        return `~~${childrenContent}~~`;
      case 'blockquote':
        return `\n> ${childrenContent.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'p':
        return childrenContent.trim() ? `\n${childrenContent.trim()}\n\n` : '\n\n';
      case 'ul':
        return `\n${childrenContent}\n`;
      case 'ol':
        return `\n${childrenContent}\n`;
      case 'li': {
        const parentTagName = element.parentElement?.tagName.toLowerCase();
        if (parentTagName === 'ol') {
          // Find standard indexing for ordered listings
          const index = Array.from(element.parentElement?.children || []).indexOf(element) + 1;
          return `${index}. ${childrenContent.trim()}\n`;
        }
        return `- ${childrenContent.trim()}\n`;
      }
      case 'hr':
        return `\n---\n\n`;
      case 'br':
        return `\n`;
      default:
        return childrenContent;
    }
  };

  const md = Array.from(doc.childNodes).map(translateNode).join('');
  
  // Sanitize multiple white spacing gaps nicely
  return md
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function EditorPanel({ onCollapse }: { onCollapse?: () => void }) {
  const { documentContent, loadDocument, saveDocument, markAsUsed, pendingInsert, resetPendingInsert } = useStore();
  const [isSavedTagVisible, setIsSavedTagVisible] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSaveDebounced = useCallback((content: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Save to store & database with a 800ms debounce
    debounceTimeout.current = setTimeout(async () => {
      await saveDocument(content);
      setIsSavedTagVisible(true);
      setTimeout(() => setIsSavedTagVisible(false), 2000);
    }, 800);
  }, [saveDocument]);

  // Image upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleInsertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Init Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleSaveDebounced(html);
    },
  });

  // Handle file selection for image upload (must be after editor init)
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      editor.chain().focus().setImage({ src: dataUrl }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);

  // Load saved content from Dexie upon initialize
  useEffect(() => {
    if (editor) {
      loadDocument().then((saved) => {
        editor.commands.setContent(saved);
      });
    }
  }, [editor, loadDocument]);

  // Watch for pendingInsert from snippet "mark as used" action
  useEffect(() => {
    if (!editor || !pendingInsert) return;
    
    editor.chain().focus().run();
    // Convert newlines to <br> so Tiptap renders proper paragraph breaks
    const htmlContent = pendingInsert.content.replace(/\n/g, '<br>');
    const blockquoteHTML = `<blockquote><p>${htmlContent}</p></blockquote><p></p>`;
    editor.commands.insertContent(blockquoteHTML);
    
    resetPendingInsert();
  }, [editor, pendingInsert, resetPendingInsert]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Drag over target handler (allowing drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Drag Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const rawPayload = e.dataTransfer.getData('application/json');
      if (!rawPayload) return;

      const data = JSON.parse(rawPayload);
      if (editor && data.content) {
        // Set focus to Editor
        editor.chain().focus().run();

        // Wrap the dropped node neatly in quotes, converting newlines to HTML breaks
        const htmlContent = data.content.replace(/\n/g, '<br>');
        const blockquoteHTML = `<blockquote><p>${htmlContent}</p></blockquote><p></p>`;
        
        // Insert node text at cursor position
        editor.commands.insertContent(blockquoteHTML);

        // Update database item to 'used' state
        markAsUsed(data.id);
      }
    } catch (err) {
      console.error('Failed to resolve dropped node:', err);
    }
  };

  const handleExportMarkdown = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const markdown = htmlToMarkdown(html);

    // Download to disk
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ideameow_script_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    if (!editor) return;
    const html = editor.getHTML();

    // Wrap in Word-compatible HTML document
    const wordHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>IdeaMeow 灵感喵 剧本</title>
        <style>
          body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; font-size: 14px; line-height: 1.8; color: #333; padding: 40px; }
          h1 { font-size: 24px; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
          h2 { font-size: 19px; font-weight: 600; margin: 20px 0 8px; }
          blockquote { border-left: 4px solid #3b82f6; padding: 8px 16px; font-style: italic; color: #1e3a8a; background: #eff6ff; margin: 12px 0; }
          img { max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; }
          ul, ol { padding-left: 24px; margin: 8px 0; }
          li { margin-bottom: 4px; }
          hr { border: 0; border-top: 1px solid #ccc; margin: 16px 0; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHTML], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ideameow_script_${Date.now()}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!editor) return null;

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200/80 shadow-xl z-20 overflow-hidden text-slate-700">
      {/* Editor Header Bar */}
      <div className="h-11 border-b border-slate-100 bg-slate-50/80 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <h2 className="font-sans font-bold text-sm text-slate-800 tracking-tight">
            剧本草稿
          </h2>
          <span className={`text-[11px] font-sans font-medium transition-opacity duration-300 flex items-center gap-1 text-emerald-600 ${isSavedTagVisible ? 'opacity-100' : 'opacity-0'}`}>
            <Lock size={11} className="stroke-[2.5]" />
            <span>已本地保存</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-all cursor-pointer"
          >
            <Download size={12} />
            <span>导出</span>
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              title="收起编辑器"
            >
              <PanelRightClose size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Formatting Commands Ribbon */}
      <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-0.5 bg-slate-50/50 shrink-0 select-none">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900 font-bold' : ''}`}
          title="加粗"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900 italic' : ''}`}
          title="斜体"
        >
          <Italic size={14} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          title="一级标题"
        >
          <Heading1 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          title="二级标题"
        >
          <Heading2 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="引用"
        >
          <Quote size={14} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="无序列表"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="有序列表"
        >
          <ListOrdered size={14} />
        </button>

        <button
          onClick={handleInsertImage}
          className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all"
          title="插入图片"
        >
          <Image size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all disabled:opacity-30"
          disabled={!editor.can().undo()}
          title="撤销"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-all disabled:opacity-30"
          disabled={!editor.can().redo()}
          title="恢复"
        >
          <Redo2 size={14} />
        </button>
      </div>

      {/* Editor Content Area with drag listeners */}
      <div
        className="flex-1 overflow-y-auto p-8 bg-slate-50/30 focus:outline-none"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="max-w-2xl mx-auto rounded-2xl bg-white border border-slate-100 shadow-sm p-8 min-h-[500px]">
          {/* Tiptap input interface */}
          <EditorContent 
            editor={editor} 
            className="min-h-[400px] outline-none selection:bg-blue-600/10 selection:text-blue-950"
          />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="h-7 bg-slate-50 border-t border-slate-100 flex items-center px-4 text-[10px] text-slate-400 font-sans select-none tracking-wide">
        <span>把右侧灵感拖进这里，开始拼出你的草稿</span>
      </div>
    </div>
  );
}
