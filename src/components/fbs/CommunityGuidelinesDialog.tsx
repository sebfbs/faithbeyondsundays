import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, Shield } from "lucide-react";

interface CommunityGuidelinesDialogProps {
  open: boolean;
  onAccept: () => void;
  context?: "chat" | "prayer";
}

export default function CommunityGuidelinesDialog({
  open,
  onAccept,
  context = "chat",
}: CommunityGuidelinesDialogProps) {
  const title = context === "prayer" ? "Before You Share" : "Welcome to Group Chat!";

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-3xl max-w-[340px]">
        <AlertDialogHeader className="items-center text-center">
          <div className="w-14 h-14 rounded-full bg-amber/10 flex items-center justify-center mb-2">
            <Heart size={26} className="text-amber" />
          </div>
          <AlertDialogTitle className="text-lg">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed space-y-2" asChild>
            <div>
              <p>
                This is a place to connect, encourage, and support each other.
                Please keep conversations uplifting and respectful.
              </p>
              <ul className="text-left space-y-1.5 mt-3">
                <li className="flex items-start gap-2">
                  <Shield size={14} className="text-amber shrink-0 mt-0.5" />
                  <span>Be kind, be real, and build each other up</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield size={14} className="text-amber shrink-0 mt-0.5" />
                  <span>No harassment, hate speech, or inappropriate content</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield size={14} className="text-amber shrink-0 mt-0.5" />
                  <span>Report anything that doesn't belong</span>
                </li>
              </ul>
              <p className="text-[10px] text-muted-foreground mt-3">
                Violations may result in content removal or account action.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={onAccept}
            className="w-full rounded-xl bg-amber text-primary-foreground hover:bg-amber/90"
          >
            I Agree — Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
