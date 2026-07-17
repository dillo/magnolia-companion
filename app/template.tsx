"use client";

import { useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";

function prefersReducedMotion() {
  try {
    return localStorage.getItem("mc-reduced-motion") === "true";
  } catch {
    return false;
  }
}

export default function Template({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saved motion preference lives in localStorage, readable only after mount
    setReducedMotion(prefersReducedMotion());
    function updateReducedMotion() {
      setReducedMotion(prefersReducedMotion());
    }
    window.addEventListener("mc-accessibility-change", updateReducedMotion);
    window.addEventListener("storage", updateReducedMotion);
    return () => {
      window.removeEventListener("mc-accessibility-change", updateReducedMotion);
      window.removeEventListener("storage", updateReducedMotion);
    };
  }, []);

  return (
    // MotionConfig strips movement at animation time, not render time,
    // so server and client markup stay identical (no hydration mismatch).
    <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
