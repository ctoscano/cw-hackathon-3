import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  variant: "assistant" | "user" | "system";
  children: React.ReactNode;
  className?: string;
}

export function MessageBubble({ variant, children, className }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-3 mb-4",
        variant === "user" ? "justify-end" : "justify-start",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
          variant === "assistant" && "bg-muted text-foreground",
          variant === "user" && "bg-primary text-primary-foreground",
          variant === "system" && "bg-accent text-accent-foreground border-2 border-accent",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export interface QuestionMessageProps {
  questionNumber: number;
  questionText: string;
  className?: string;
}

export function QuestionMessage({ questionNumber, questionText, className }: QuestionMessageProps) {
  return (
    <MessageBubble variant="assistant" className={className}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
            {questionNumber}
          </span>
          <span className="text-xs font-semibold uppercase opacity-70">Question</span>
        </div>
        <p className="text-sm leading-relaxed">{questionText}</p>
      </div>
    </MessageBubble>
  );
}

export interface AnswerMessageProps {
  answer: string | string[];
  className?: string;
}

export function AnswerMessage({ answer, className }: AnswerMessageProps) {
  const answerText = Array.isArray(answer) ? answer.join(", ") : answer;

  return (
    <MessageBubble variant="user" className={className}>
      <p className="text-sm leading-relaxed">{answerText}</p>
    </MessageBubble>
  );
}

export interface ReflectionMessageProps {
  reflection: string;
  className?: string;
}

export function ReflectionMessage({ reflection, className }: ReflectionMessageProps) {
  return (
    <MessageBubble variant="assistant" className={className}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">💭</span>
          <span className="text-xs font-semibold uppercase opacity-70">Reflection</span>
        </div>
        <p className="text-sm leading-relaxed italic">{reflection}</p>
      </div>
    </MessageBubble>
  );
}
