import { ImagePlus, Mic, Send, Smile } from "lucide-react";
import type { Conversation } from "./chatMock";
import { useChatDraft } from "./ChatBoxParts";

const QUICK = ["👍", "❤️", "😂", "On my way!", "Let's call?"];
const EMOJIS = ["😀","😂","😍","🔥","👍","🎉","😢","🙏","💯","❤️","😮","👏","🤝","✨","🚀","💻"];

export function ChatInput({ conversation, onSend }: { conversation: Conversation; onSend: (t: string) => void }) {
  const { draft, setDraft, showEmoji, setShowEmoji } = useChatDraft();
  const c = conversation;

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
    setShowEmoji(false);
  }

  return (
    <div className="shrink-0 bg-white dark:bg-[#0f172a]">
      <div className="px-3 sm:px-5 pt-2 pb-1 flex gap-2 overflow-x-auto">
        {QUICK.map((q) => (
          <button key={q} onClick={() => onSend(q)} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-[#083695]/15 dark:border-white/15 text-[#083695] dark:text-blue-300 hover:bg-[#083695] hover:text-white dark:hover:bg-blue-600 transition-colors cursor-pointer">
            {q}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="p-3 sm:p-4">
        <div className="flex items-end gap-1.5 bg-[#eef2fb] dark:bg-white/5 rounded-2xl px-2 py-2">
          <button type="button" onClick={() => setShowEmoji((v) => !v)} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-[#083695] cursor-pointer" aria-label="Emoji"><Smile size={20} /></button>
          <button type="button" className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-[#083695] cursor-pointer" aria-label="Attach"><ImagePlus size={20} /></button>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${c.name.split(" ")[0]}...`} className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 py-2" />
          {draft.trim() ? (
            <button type="submit" className="h-10 w-10 shrink-0 rounded-xl bg-[#083695] dark:bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer" aria-label="Send"><Send size={17} /></button>
          ) : (
            <button type="button" className="h-10 w-10 shrink-0 rounded-xl bg-[#083695]/10 dark:bg-white/10 text-[#083695] dark:text-white flex items-center justify-center cursor-pointer" aria-label="Voice"><Mic size={18} /></button>
          )}
        </div>
        {showEmoji && (
          <div className="mt-2 flex gap-1 flex-wrap bg-[#eef2fb] dark:bg-white/5 rounded-2xl p-2">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setDraft((d) => d + e)} className="text-xl hover:scale-125 transition-transform cursor-pointer p-1">{e}</button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
