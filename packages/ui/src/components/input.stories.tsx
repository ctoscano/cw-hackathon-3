import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "search", "tel", "url"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
  args: {
    placeholder: "Type something...",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "Hello, World!",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Cannot edit this",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "300px" }}>
      <label htmlFor="demo-input" style={{ fontSize: "14px", fontWeight: 500 }}>
        Email address
      </label>
      <Input id="demo-input" {...args} />
    </div>
  ),
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
};
