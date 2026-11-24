import { signInWithGoogle } from "@/lib/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function GoogleButton({ role, next, label = "Continuer avec Google" }: { role?: string; next?: string; label?: string }) {
  return (
    <form action={signInWithGoogle}>
      {role && <input type="hidden" name="role" value={role} />}
      {next && <input type="hidden" name="next" value={next} />}
      <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full bg-white")}>
        <GoogleIcon /> {label}
      </button>
    </form>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-400">
      <span className="h-px flex-1 bg-forest-900/10" /> ou <span className="h-px flex-1 bg-forest-900/10" />
    </div>
  );
}
