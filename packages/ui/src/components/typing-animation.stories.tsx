import type { Meta, StoryObj } from "@storybook/react";
import { TypingAnimation } from "./typing-animation";

const meta = {
  title: "Components/TypingAnimation",
  component: TypingAnimation,
  argTypes: {
    duration: {
      control: { type: "number", min: 20, max: 500, step: 10 },
    },
    delay: {
      control: { type: "number", min: 0, max: 3000, step: 100 },
    },
    pauseDelay: {
      control: { type: "number", min: 200, max: 5000, step: 100 },
    },
    loop: {
      control: "boolean",
    },
    showCursor: {
      control: "boolean",
    },
    blinkCursor: {
      control: "boolean",
    },
    cursorStyle: {
      control: "select",
      options: ["line", "block", "underscore"],
    },
    startOnView: {
      control: "boolean",
    },
  },
  args: {
    children: "Hello, World!",
    duration: 100,
    showCursor: true,
    blinkCursor: true,
    cursorStyle: "line",
    startOnView: false,
  },
} satisfies Meta<typeof TypingAnimation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Hello, World!",
  },
};

export const SingleWord: Story = {
  args: {
    children: "Typing...",
    duration: 80,
  },
};

export const MultiWordRotation: Story = {
  name: "Multi-Word Rotation",
  args: {
    words: ["React", "TypeScript", "Tailwind CSS", "Storybook"],
    duration: 80,
    pauseDelay: 1500,
    loop: false,
    startOnView: false,
  },
};

export const LoopingWords: Story = {
  name: "Looping Words",
  args: {
    words: ["Build", "Ship", "Iterate"],
    duration: 60,
    pauseDelay: 1000,
    loop: true,
    startOnView: false,
  },
};

export const BlockCursor: Story = {
  name: "Block Cursor",
  args: {
    children: "Block cursor style",
    cursorStyle: "block",
    duration: 80,
  },
};

export const UnderscoreCursor: Story = {
  name: "Underscore Cursor",
  args: {
    children: "Underscore cursor style",
    cursorStyle: "underscore",
    duration: 80,
  },
};

export const NoCursor: Story = {
  name: "No Cursor",
  args: {
    children: "No cursor shown",
    showCursor: false,
    duration: 80,
  },
};

export const SlowTyping: Story = {
  name: "Slow Typing",
  args: {
    children: "This types very slowly...",
    duration: 300,
  },
};

export const FastTyping: Story = {
  name: "Fast Typing",
  args: {
    children: "This types really fast!",
    duration: 30,
  },
};

export const AllCursorStyles: Story = {
  name: "All Cursor Styles",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "18px" }}>
      <div>
        <span style={{ fontSize: "12px", color: "gray", display: "block", marginBottom: "4px" }}>
          Line (default)
        </span>
        <TypingAnimation cursorStyle="line" duration={80} startOnView={false}>
          Line cursor
        </TypingAnimation>
      </div>
      <div>
        <span style={{ fontSize: "12px", color: "gray", display: "block", marginBottom: "4px" }}>
          Block
        </span>
        <TypingAnimation cursorStyle="block" duration={80} startOnView={false}>
          Block cursor
        </TypingAnimation>
      </div>
      <div>
        <span style={{ fontSize: "12px", color: "gray", display: "block", marginBottom: "4px" }}>
          Underscore
        </span>
        <TypingAnimation cursorStyle="underscore" duration={80} startOnView={false}>
          Underscore cursor
        </TypingAnimation>
      </div>
    </div>
  ),
};
