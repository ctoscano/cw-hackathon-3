import type { Meta, StoryObj } from "@storybook/react";
import { TypingIndicator } from "./typing-indicator";

const meta = {
  title: "Components/TypingIndicator",
  component: TypingIndicator,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    dotColor: {
      control: "color",
    },
  },
  args: {
    size: "md",
  },
} satisfies Meta<typeof TypingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "md",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const CustomColor: Story = {
  name: "Custom Color",
  args: {
    size: "md",
    dotColor: "#d97757",
  },
};

export const AllSizes: Story = {
  name: "All Sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: "gray", width: "40px" }}>sm</span>
        <TypingIndicator size="sm" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: "gray", width: "40px" }}>md</span>
        <TypingIndicator size="md" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: "gray", width: "40px" }}>lg</span>
        <TypingIndicator size="lg" />
      </div>
    </div>
  ),
};
