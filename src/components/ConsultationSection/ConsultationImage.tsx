'use client'
import Image from "next/image";
import { motion } from "framer-motion";

const ConsultationImage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, x: -24 }}
      whileInView={{ opacity: 1, scale: 1, x: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Image src="/consultation/consultation1.png" height={500} width={500} alt=""/>
    </motion.div>
  );
};

export default ConsultationImage;
