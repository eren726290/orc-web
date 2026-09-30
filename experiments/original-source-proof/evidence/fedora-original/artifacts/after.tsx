import { useState } from "react";
import { motion } from "motion/react";

// Keep this comment and its unusual spacing:   café 🌱.
const products = [
  { id: "p1", title: "Desk lamp" },
  { id: "p2", title: "Reading chair 🌱" },
];

function Hero({ instanceId, title }: { instanceId: string; title: string }) {
  const [clicks, setClicks] = useState(0);
  return (
    <motion.section data-instance={instanceId} initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <h1 className="text-5xl font-bold hover:underline md:tracking-wide">{title}</h1>
      <button onClick={() => setClicks(clicks + 1)}>Clicks: {clicks}</button>
    </motion.section>
  );
}

function HeroIndependentA({ instanceId, title }: { instanceId: string; title: string }) {
  const [clicks, setClicks] = useState(0);
  return (
    <motion.section data-instance={instanceId} initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <h1 className="text-5xl font-medium hover:underline md:tracking-wide">{title}</h1>
      <button onClick={() => setClicks(clicks + 1)}>Clicks: {clicks}</button>
    </motion.section>
  );
}

export default function App() {
  return (
    <main>
      <HeroIndependentA instanceId="hero-a" title={"Build \"ORC\" & <teams> {together} 🌱"} />
      <Hero instanceId="hero-b" title="Meet the team" />
      <div data-products="true">
        {products.map((product) => (
          <article key={product.id} data-product={product.id}>
            <h2>{product.title}</h2>
          </article>
        ))}
      </div>
    </main>
  );
}
