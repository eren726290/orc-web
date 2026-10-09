import { Feature as Spotlight } from "@/panels/Feature";

// Different names, file paths, record keys, texts, and declaration order.
function Notice({ caption }: { caption: string }) {
  return <section><h2 className="text-4xl font-bold hover:underline md:tracking-wide">{caption}</h2></section>;
}
function inputAdapter(input: { headline: string }) {
  return input;
}
const calculated = "Price: " + 21;
const remote = inputAdapter({ headline: "From external-shaped input" });
const inventory = [
  { code: 87, name: "Oak stool" },
  { code: 42, name: "Wool rug" },
];

export default function Landing() {
  return (
    <main>
      <h1 className="text-4xl font-bold">Another authored heading</h1>
      <Notice caption="Alpha instance" />
      <Notice caption="Beta instance" />
      <Spotlight message="Aliased sibling module" />
      <Spotlight message="Another cross-file instance" />
      <div>
        {inventory.map(entry => (
          <article key={entry.code}><h3 className="text-xl font-bold">{entry.name}</h3></article>
        ))}
      </div>
      <h4 className="text-xl">{calculated}</h4>
      <h4 className="text-xl">{remote.headline}</h4>
    </main>
  );
}
