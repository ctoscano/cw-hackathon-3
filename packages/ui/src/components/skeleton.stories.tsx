import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: { width: "200px", height: "20px" },
  },
};

export const Circle: Story = {
  args: {
    style: { width: "48px", height: "48px", borderRadius: "9999px" },
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div style={{ width: "380px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <Skeleton style={{ width: "100%", height: "200px", borderRadius: "12px" }} />
      <Skeleton style={{ width: "60%", height: "20px" }} />
      <Skeleton style={{ width: "100%", height: "16px" }} />
      <Skeleton style={{ width: "80%", height: "16px" }} />
    </div>
  ),
};

export const ProfileSkeleton: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <Skeleton style={{ width: "48px", height: "48px", borderRadius: "9999px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Skeleton style={{ width: "160px", height: "16px" }} />
        <Skeleton style={{ width: "120px", height: "14px" }} />
      </div>
    </div>
  ),
};

export const TextBlock: Story = {
  render: () => (
    <div style={{ width: "300px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <Skeleton style={{ width: "100%", height: "14px" }} />
      <Skeleton style={{ width: "90%", height: "14px" }} />
      <Skeleton style={{ width: "95%", height: "14px" }} />
      <Skeleton style={{ width: "70%", height: "14px" }} />
    </div>
  ),
};
