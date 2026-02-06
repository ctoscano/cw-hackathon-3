/**
 * Value proposition component shown before the first question
 */

import { Card, CardContent } from "@cw-hackathon/ui";
import { Check } from "lucide-react";

export function IntakeValueProposition() {
  return (
    <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
      <CardContent className="py-5 px-6">
        <p className="text-foreground font-medium text-[15px] leading-relaxed mb-3">
          These questions help you explore whether therapy might be worth trying right now.
        </p>
        <ul className="space-y-2">
          {[
            "Get clearer on what's happening and why it matters",
            "Understand how therapy might help your specific situation",
            "Learn what to talk about and look for in a first session",
            "Try a few optional practices you can bring to therapy",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-muted-foreground leading-snug"
            >
              <Check className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
