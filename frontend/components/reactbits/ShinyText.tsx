import { motion } from "framer-motion";

export const ShinyText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <motion.span
      className={`inline-block text-transparent bg-clip-text bg-[linear-gradient(110deg,#e2e8f0,45%,#38bdf8,55%,#e2e8f0)] bg-[length:200%_100%] ${className}`}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 3,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
};
