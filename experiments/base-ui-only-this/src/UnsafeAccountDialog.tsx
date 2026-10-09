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
import { UnsafeDetail } from "@/UnsafeDetail";

export function UnsafeAccountDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open unsupported</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsupported copy control</DialogTitle>
          <DialogDescription>This path captures a module binding.</DialogDescription>
        </DialogHeader>
        <UnsafeDetail />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
