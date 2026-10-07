function Notice({ title }: { title: string }) {
  return <h1 className="text-4xl font-bold">{title}</h1>;
}
export default function App() {
  return <main><Notice title="Same heading" /><Notice title={"Second successive edit 🌱"} /></main>;
}
