import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Detail as Note } from "@/Detail";

export function AccountDialog({ title, trigger }: { title: string; trigger: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="text-xl font-bold">{title}</span>
          </DialogTitle>
          <DialogDescription>Review your account before continuing.</DialogDescription>
        </DialogHeader>
        <Note />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
