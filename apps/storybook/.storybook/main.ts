import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../../../packages/ui/src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-themes"],
  typescript: {
    reactDocgen: false,
  },
  async viteFinal(config) {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      plugins: [tailwindcss()],
    });
  },
};

export default config;
