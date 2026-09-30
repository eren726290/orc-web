export function Feature({ message }: { message: string }) {
  return <aside><h2 className="text-4xl font-bold">{message}</h2></aside>;
}

// Reordered export, unlike the first fixture.
export const untouched = "Unrelated module value";
