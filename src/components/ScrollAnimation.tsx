
"use client";

import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

const animationVariants = {
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  hidden: { opacity: 0, y: 50 },
};

export function ScrollAnimation({ children }: { children: React.ReactNode }) {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={animationVariants}
    >
      {children}
    </motion.div>
  );
}
