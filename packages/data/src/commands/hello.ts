import { defineCommand } from "citty";

export const helloCommand = defineCommand({
  meta: {
    name: "hello",
    description: "Say hello to the world",
  },
  args: {
    name: {
      type: "positional",
      description: "Name to greet",
      required: false,
      default: "World",
    },
    loud: {
      type: "boolean",
      description: "Make it loud with exclamation marks",
      alias: "l",
      default: false,
    },
  },
  run({ args }) {
    const greeting = `Hello, ${args.name}!`;
    const output = args.loud ? `${greeting.toUpperCase()}!!` : greeting;

    console.log(output);
    console.log(`\nRunning with Bun v${Bun.version}`);

    return {
      success: true,
      message: output,
    };
  },
});
