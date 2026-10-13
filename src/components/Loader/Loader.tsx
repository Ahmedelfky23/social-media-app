import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

export function Loader({ message = "Logging out..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-100 bg-[#083695]/90 dark:bg-[#090d16]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
    >
      <div className="relative flex items-center justify-center mb-4">
        <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <Loader2 className="absolute h-7 w-7 text-white animate-spin" />
      </div>
      <p className="text-base font-semibold tracking-wide text-white">{message}</p>
      <p className="text-xs text-white/70 mt-1">Please wait a moment</p>
    </motion.div>
  );
}
