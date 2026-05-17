import { motion } from "framer-motion";
import { ReactNode } from "react";

export const AuroraBackground = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative w-full min-h-screen bg-[#0A0F1E] overflow-hidden">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
          y: [0, -50, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none"
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
