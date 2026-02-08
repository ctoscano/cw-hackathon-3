import type { Meta, StoryObj } from "@storybook/react";
import { AnswerMessage, MessageBubble, QuestionMessage, ReflectionMessage } from "./message-bubble";

const meta = {
  title: "Components/MessageBubble",
  component: MessageBubble,
  argTypes: {
    variant: {
      control: "select",
      options: ["assistant", "user", "system"],
    },
  },
  args: {
    variant: "assistant",
    children: "Hello, how can I help you today?",
  },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {
  args: {
    variant: "assistant",
    children: "Hello, how can I help you today?",
  },
};

export const User: Story = {
  args: {
    variant: "user",
    children: "I need help with my project.",
  },
};

export const System: Story = {
  args: {
    variant: "system",
    children: "System notification: your session has started.",
  },
};

export const QuestionMessageStory: Story = {
  name: "QuestionMessage",
  render: () => (
    <QuestionMessage questionNumber={1} questionText="What is the primary goal of your project?" />
  ),
};

export const AnswerMessageStory: Story = {
  name: "AnswerMessage",
  render: () => (
    <AnswerMessage answer="We want to build a component library for our design system." />
  ),
};

export const AnswerMessageArray: Story = {
  name: "AnswerMessage (array)",
  render: () => <AnswerMessage answer={["React", "TypeScript", "Tailwind CSS"]} />,
};

export const ReflectionMessageStory: Story = {
  name: "ReflectionMessage",
  render: () => (
    <ReflectionMessage reflection="Great choice! A component library will help maintain consistency across your application and speed up development." />
  ),
};

export const ConversationFlow: Story = {
  name: "Conversation Flow",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "600px" }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div>
      <QuestionMessage
        questionNumber={1}
        questionText="What is the primary goal of your project?"
      />
      <AnswerMessage answer="We want to build a component library for our design system." />
      <ReflectionMessage reflection="A component library is a great foundation. It will help maintain visual consistency and speed up development across teams." />
      <QuestionMessage
        questionNumber={2}
        questionText="What frameworks and tools are you currently using?"
      />
      <AnswerMessage answer={["React", "TypeScript", "Tailwind CSS"]} />
      <ReflectionMessage reflection="Excellent stack! React with TypeScript provides type safety, and Tailwind CSS enables rapid styling with utility classes." />
    </div>
  ),
};

export const LongText: Story = {
  name: "Long Text",
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <MessageBubble variant="assistant">
        This is a very long message that demonstrates how the message bubble handles lengthy
        content. It should wrap nicely within the container and maintain readability. The max-width
        constraint ensures that messages don't stretch too wide, which helps with reading
        comprehension. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </MessageBubble>
      <MessageBubble variant="user">
        This is also a long reply from the user side. It demonstrates that user messages also handle
        long content gracefully. The bubble should maintain its styling and alignment while
        accommodating the extra text content without any layout issues.
      </MessageBubble>
    </div>
  ),
};

export const ShortText: Story = {
  name: "Short Text",
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <MessageBubble variant="assistant">Hi!</MessageBubble>
      <MessageBubble variant="user">Hey</MessageBubble>
      <MessageBubble variant="system">OK</MessageBubble>
    </div>
  ),
};
