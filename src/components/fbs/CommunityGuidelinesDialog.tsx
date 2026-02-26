import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart } from "lucide-react";

interface CommunityGuidelinesDialogProps {
  open: boolean;
  onAccept: () => void;
}

export default function CommunityGuidelinesDialog({
  open,
  onAccept,
}: CommunityGuidelinesDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-3xl max-w-[340px]">
        <AlertDialogHeader className="items-center text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-2">
            <Heart size={26} className="text-accent" />
          </div>
          <AlertDialogTitle className="text-lg">
            Welcome to Group Chat!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            This is a place to connect, encourage, and support each other.
            Please keep conversations uplifting and respectful. Be kind, be
            real, and build each other up.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={onAccept}
            className="w-full rounded-xl"
          >
            I Agree
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
