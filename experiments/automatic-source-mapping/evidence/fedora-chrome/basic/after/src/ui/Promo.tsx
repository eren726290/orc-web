// Keep this independent module comment and helper unchanged.
export const untouched = "Unrelated module value";

export function Promo(
    {
        label
    }: {
        label: string;
    }
) {
    return <aside><h2 className="text-5xl font-bold">{label}</h2></aside>;
}