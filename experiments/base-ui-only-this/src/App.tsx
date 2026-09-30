import { AccountDialog as Panel } from "@/AccountDialog";
import { UnsafeAccountDialog } from "@/UnsafeAccountDialog";

// Unrelated source and instance props must survive the copy: café 🌱.
export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Real Base UI dialog experiment</h1>
      <div className="flex gap-4">
        <Panel title="Personal account" trigger="Open personal" />
        <Panel title="Team account" trigger="Open team" />
        <UnsafeAccountDialog />
      </div>
    </main>
  );
}
