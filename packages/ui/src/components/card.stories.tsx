import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ width: "380px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with any elements you need.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
          Your project will be created with default settings. You can customize it later.
        </p>
      </CardContent>
      <CardFooter style={{ justifyContent: "flex-end", gap: "8px" }}>
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleContent: Story = {
  render: () => (
    <Card>
      <CardContent style={{ paddingTop: "24px" }}>
        <p>A card with just content and no header.</p>
      </CardContent>
    </Card>
  ),
};

export const MultipleCards: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "800px" }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your site analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: "32px", fontWeight: 700 }}>1,234</p>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Total visits</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Monthly revenue report.</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: "32px", fontWeight: 700 }}>$5,678</p>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>This month</p>
        </CardContent>
      </Card>
    </div>
  ),
};
