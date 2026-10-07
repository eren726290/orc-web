import { Promo as Offer } from "@/ui/Promo";

// Unrelated authored comment: preserve café and Unicode 🌱.
const cards = [
  { sku: "lamp", label: "Desk lamp" },
  { sku: "chair", label: "Reading chair" },
];
const remote = externalSnapshot({ headline: "From external-shaped input" });
const calculated = "Price: " + 21;
function externalSnapshot(input: { headline: string }) {
  return input;
}

function Hero({ title }: { title: string }) {
  return <section><h2 className="text-4xl font-bold hover:underline md:tracking-wide">{title}</h2></section>;
}

export default function App() {
  return (
    <main>
      <h1 className="text-4xl font-bold">Ordinary literal heading</h1>
      <Hero title="First instance" />
      <Hero title="Second instance" />
      <Offer label="Across the file boundary" />
      <Offer label="Another cross-file instance" />
      <div>
        {cards.map(card => (
          <article key={card.sku}><h3 className="text-xl font-bold">{card.label}</h3></article>
        ))}
      </div>
      <h4 className="text-xl">{calculated}</h4>
      <h4 className="text-xl">{remote.headline}</h4>
    </main>
  );
}
