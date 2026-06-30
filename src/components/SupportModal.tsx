import React, { useState, useCallback } from 'react';
import { X, Copy, RefreshCw, Heart, Github } from 'lucide-react';

const FORTUNES = [
  '你刚刚让一个免费工具多了一点继续维护的勇气。',
  '今日功德：让一只开源小猫继续叼灵感。',
  '愿你的灵感不丢失，爆款不跑偏，剪辑不卡顿。',
  '你刚刚修复了维护者的一点点精神损耗。',
  '这不是一笔消费，是一次对免费工具的温柔续命。',
  '愿你的 AI 回答都能被小猫精准叼回。',
  '你让一个 Local-First 小工具多了一点继续维护的勇气。',
  '今天又有一只创作小猫没有被世界遗忘。',
];

const TIERS = [
  { label: '一口小鱼干', price: '¥3', emoji: '🐟' },
  { label: '一碗猫粮', price: '¥9.9', emoji: '🥣' },
  { label: '云养喵共创者', price: '¥19.9', emoji: '☁️' },
  { label: '功能猫窝认养', price: '¥99', emoji: '🏠' },
  { label: '专属定制', price: '¥399+', emoji: '✨' },
];

const BADGE_TEXT = '🐱 IdeaMeow 支持者｜我给灵感喵喂过猫粮，愿天下灵感都能被好好叼回。';

type PayTab = 'wechat' | 'alipay' | 'github';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [payTab, setPayTab] = useState<PayTab>('wechat');
  const [fortune, setFortune] = useState(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
  const [toast, setToast] = useState<string | null>(null);
  const [fed, setFed] = useState(false);

  const rerollFortune = useCallback(() => {
    let next: string;
    do {
      next = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    } while (next === fortune && FORTUNES.length > 1);
    setFortune(next);
  }, [fortune]);

  const copyBadge = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BADGE_TEXT);
      setToast('徽章已复制');
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast('复制失败，请手动复制');
      setTimeout(() => setToast(null), 2000);
    }
  }, []);

  const handleFed = useCallback(() => {
    setFed(true);
    setToast('谢谢你给小猫喂粮！灵感会继续好好叼回来的~');
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐱</span>
            <div>
              <h2 className="font-bold text-base text-white">灵感喵补给站</h2>
              <p className="text-xs text-slate-400">小额自愿支持 · 不验证支付 · 不锁核心功能</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Intro */}
          <p className="text-sm text-slate-300 leading-relaxed">
            IdeaMeow 会继续免费、开源、可自部署。如果这只小猫帮你叼回过灵感，欢迎喂一点猫粮。
          </p>

          {/* Tier Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {TIERS.map((tier) => (
              <div
                key={tier.label}
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:border-blue-500/30 hover:bg-slate-800/60 transition-all cursor-default"
              >
                <span className="text-2xl">{tier.emoji}</span>
                <span className="text-xs text-slate-300 font-medium">{tier.label}</span>
                <span className="text-lg font-bold text-white">{tier.price}</span>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: QR Code */}
            <div className="space-y-3">
              {/* Pay Tabs */}
              <div className="flex gap-1 bg-slate-800/60 rounded-full p-0.5 border border-slate-700/50">
                {([
                  { key: 'wechat' as PayTab, label: '微信' },
                  { key: 'alipay' as PayTab, label: '支付宝' },
                  { key: 'github' as PayTab, label: 'GitHub' },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setPayTab(tab.key)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                      payTab === tab.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* QR Panel */}
              {(payTab === 'wechat' || payTab === 'alipay') && (
                <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3 border border-slate-200">
                  <img
                    src={payTab === 'wechat' ? './support/wechat-pay.png' : './support/alipay-pay.jpg'}
                    alt={payTab === 'wechat' ? '微信收款码' : '支付宝收款码'}
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                  <p className="text-xs text-slate-500 text-center">
                    扫码后可按喜欢的档位自愿支持。核心功能不受影响。
                  </p>
                </div>
              )}

              {payTab === 'github' && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center gap-4 text-center">
                  <Github size={40} className="text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">通过 GitHub 支持</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      适合希望用更正式方式支持开源项目的朋友。
                    </p>
                  </div>
                  <a
                    href="https://github.com/sponsors/nicoliustudio"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-all cursor-pointer no-underline"
                  >
                    打开 GitHub Sponsors
                  </a>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleFed}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Heart size={13} /> 我已喂猫粮，领取小惊喜
                </button>
              </div>
            </div>

            {/* Right: Fortune + Badge */}
            <div className="space-y-3">
              {/* Fortune Card */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">当前掉落</p>
                <p className="text-sm text-slate-200 leading-relaxed">{fortune}</p>
              </div>

              {/* Badge */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
                {BADGE_TEXT}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={rerollFortune}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700/50 transition-all cursor-pointer"
                >
                  <RefreshCw size={12} /> 再掉落一张
                </button>
                <button
                  onClick={copyBadge}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700/50 transition-all cursor-pointer"
                >
                  <Copy size={12} /> 复制徽章
                </button>
              </div>
            </div>
          </div>

          {/* Safety Note */}
          <div className="pt-4 border-t border-slate-800/60">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              本地保存，不上传正文，不强制登录，不影响免费使用。小额支持不等于购买定制开发。功能认养会优先评估，但是否实现取决于项目方向、维护成本和安全边界。
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-full shadow-xl z-[60] animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
