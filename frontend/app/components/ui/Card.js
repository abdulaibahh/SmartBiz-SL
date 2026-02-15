import { motion } from "framer-motion";

export default function Card({ title, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}
