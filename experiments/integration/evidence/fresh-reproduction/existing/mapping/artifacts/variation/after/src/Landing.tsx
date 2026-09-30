const unrelatedInsertedValue = 123;
import { Feature as Spotlight } from "@/panels/Feature";

// Different names, file paths, record keys, texts, and declaration order.
function Notice(
    {
        caption
    }: {
        caption: string;
    }
) {
    return <section><h2 className="text-5xl font-bold hover:underline md:tracking-wide">{caption}</h2></section>;
}

function inputAdapter(
    input: {
        headline: string;
    }
) {
    return input;
}

const calculated = "Price: " + 21;

const remote = inputAdapter({
    headline: "From external-shaped input"
});

const inventory = [{
    code: 42,
    name: "Record edited after reorder"
}, {
    code: 87,
    name: "Oak stool"
}];

export default function Landing() {
    return (
        <main>
            <h1 className="text-5xl font-bold">{"Literal \"quotes\" & <teams> {safe} 🌱"}</h1>
            <Notice caption={"Instance after formatting"} />
            <Notice caption="Beta instance" />
            <Spotlight message={"Edited cross-file usage"} />
            <Spotlight message="Another cross-file instance" />
            <div>
                {inventory.map(
                    entry => (<article key={entry.code}><h3 className="text-xl font-bold">{entry.name}</h3></article>)
                )}
            </div>
            <h4 className="text-4xl">{calculated}</h4>
            <h4 className="text-xl">{remote.headline}</h4>
        </main>
    );
}