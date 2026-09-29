const unrelatedInsertedValue = 123;
import { Promo as Offer } from "@/ui/Promo";

// Unrelated authored comment: preserve café and Unicode 🌱.
const cards = [{
    sku: "chair",
    label: "Record edited after reorder"
}, {
    sku: "lamp",
    label: "Desk lamp"
}];

const remote = externalSnapshot({
    headline: "From external-shaped input"
});

const calculated = "Price: " + 21;

function externalSnapshot(
    input: {
        headline: string;
    }
) {
    return input;
}

function Hero(
    {
        title
    }: {
        title: string;
    }
) {
    return <section><h2 className="text-5xl font-bold hover:underline md:tracking-wide">{title}</h2></section>;
}

export default function App() {
    return (
        <main>
            <h1 className="text-5xl font-bold">{"Literal \"quotes\" & <teams> {safe} 🌱"}</h1>
            <Hero title={"Instance after formatting"} />
            <Hero title="Second instance" />
            <Offer label={"Edited cross-file usage"} />
            <Offer label="Another cross-file instance" />
            <div>
                {cards.map(
                    card => (<article key={card.sku}><h3 className="text-xl font-bold">{card.label}</h3></article>)
                )}
            </div>
            <h4 className="text-4xl">{calculated}</h4>
            <h4 className="text-xl">{remote.headline}</h4>
        </main>
    );
}