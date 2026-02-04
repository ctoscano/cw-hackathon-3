# Chrome DevTools MCP Integration

This document explains how to use the Chrome DevTools MCP server to give Claude Code visibility into your actual Chrome browser tabs for real-time debugging.

## What This Enables

With Chrome DevTools MCP, Claude Code can:
- ✅ Connect to your actual Chrome browser tabs
- ✅ Capture console errors without copy-pasting
- ✅ Inspect DOM elements and network requests
- ✅ Take screenshots of current state
- ✅ Execute JavaScript in the page context
- ✅ Monitor performance and debug issues in real-time

## Quick Start

### 1. Launch Debug Chrome

```bash
# Easy way - use npm script
pnpm debug:chrome

# Or run the script directly
./scripts/chrome-debug.sh
```

This launches Chrome with:
- DevTools Protocol enabled on port 9222
- Persistent profile at `~/.chrome-debug-profile` (saves logins)
- Debug endpoint: http://localhost:9222/json

### 2. Restart Claude Code

After launching debug Chrome, restart Claude Code to load the Chrome DevTools MCP server.

### 3. Use Claude Code to Inspect

**Example commands you can use:**

```
"List available Chrome tabs"
"Inspect console errors in current Chrome tab"
"Take a screenshot of the current page"
"Debug the error on localhost:3004"
"Check network requests for failed API calls"
```

## Usage Workflow

### Debugging Browser Errors (Your Use Case)

**Old workflow:**
1. See error in Chrome → Screenshot → Copy-paste → Share with Claude

**New workflow:**
1. Launch debug Chrome: `pnpm debug:chrome`
2. Navigate to page with error
3. Tell Claude: "Inspect current Chrome tab and debug the error"
4. Claude automatically:
   - Connects to your tab
   - Reads console errors
   - Inspects DOM
   - Suggests fixes

### Example Session

```bash
# Terminal 1 - Launch debug Chrome
pnpm debug:chrome

# Navigate to your app (e.g., http://localhost:3004)
# See an error in the console

# Terminal 2 - In Claude Code
"Inspect the console errors on localhost:3004"
```

Claude will use the Chrome DevTools MCP to:
- List available tabs
- Find the localhost:3004 tab
- Read console errors
- Provide debugging suggestions

## Configuration Details

### MCP Server Configuration

Located in `.mcp.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--browserUrl=http://127.0.0.1:9222"]
    }
  }
}
```

### Chrome Launch Script

Located at `scripts/chrome-debug.sh`:

```bash
#!/bin/bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  "$@"
```

**Key flags:**
- `--remote-debugging-port=9222` - Enables DevTools Protocol
- `--user-data-dir="$HOME/.chrome-debug-profile"` - Persistent profile (keeps logins)

## Multiple Chrome Instances

**Can I use my regular Chrome while debugging?**

No - you need to close regular Chrome before launching debug Chrome (port 9222 conflict).

**Alternative:** Keep debug Chrome open in a separate workspace for development.

## Multiple Claude Code Instances

**How do multiple instances work?**

All Claude Code instances can connect to the same debug Chrome (port 9222):
- They share the same browser state
- No conflicts - they're just reading Chrome's debug info
- Each instance maintains its own MCP connection

## Troubleshooting

### Port 9222 Already in Use

**Error:** `Address already in use`

**Solution:** `Use instance that is already running`

### Chrome DevTools MCP Not Loading

**Check:**
1. Is debug Chrome running? (Check http://localhost:9222/json)
2. Did you restart Claude Code after adding MCP server?
3. Check Claude Code logs for MCP connection errors

**Verify endpoint:**
```bash
curl http://localhost:9222/json
# Should return JSON array of Chrome tabs
```

### Can't Connect to Regular Chrome

**Expected behavior:** Chrome DevTools Protocol requires Chrome to be launched with `--remote-debugging-port`. Your regular browsing Chrome won't work.

**Solution:** Use the debug Chrome instance launched with `pnpm debug:chrome`.

### Node.js Version Too Old

**Requirement:** Node.js 22+

**Check version:**
```bash
node --version
```

**Upgrade if needed:**
```bash
# Using nvm
nvm install 22
nvm use 22

# Or using Homebrew
brew upgrade node
```

## Available MCP Tools

Once connected, Claude Code has access to these Chrome DevTools tools:

- **Navigation:** Navigate to URLs, go back/forward
- **DOM Inspection:** Query selectors, inspect elements
- **Console:** Read console logs, errors, warnings
- **Network:** Monitor requests, responses, failures
- **Screenshots:** Capture page or element screenshots
- **JavaScript Execution:** Run code in page context
- **Performance:** Record traces, analyze performance

## Comparison with Other Browser Tools

### Chrome DevTools MCP vs Playwright MCP

| Feature | Chrome DevTools MCP | Playwright MCP |
|---------|-------------------|----------------|
| Connect to existing tabs | ✅ Yes | ❌ No |
| Launch own browser | ❌ No | ✅ Yes |
| Best for | Debugging live work | Automated testing |
| Persistent profile | ✅ Yes (keeps logins) | ❌ Temporary |

**Recommendation:** Use both!
- Chrome DevTools MCP → Debug existing work in progress
- Playwright MCP → Automated testing and reproduction

## Security Considerations

### Why Separate Debug Profile?

Chrome's DevTools Protocol exposes full browser control. Using a separate profile:
- Isolates debugging from your regular browsing
- Prevents accidental exposure of personal data
- Allows Claude Code to inspect without security restrictions

### What Gets Saved?

In `~/.chrome-debug-profile`:
- Login sessions (cookies, local storage)
- Browser history
- Extensions (if installed in debug Chrome)
- Bookmarks and settings

This is intentional - it allows you to:
- Stay logged into development apps
- Test authenticated workflows
- Maintain consistent debugging environment

### Cleanup

To reset the debug profile:
```bash
rm -rf ~/.chrome-debug-profile
```

Next time you run `pnpm debug:chrome`, it will create a fresh profile.

## Best Practices

1. **Keep debug Chrome open during development** - Avoid repeated launches
2. **Use persistent profile** - Saves time logging into dev apps
3. **Close regular Chrome** - Prevents port conflicts
4. **Verify endpoint** - Check http://localhost:9222/json before debugging
5. **Restart Claude Code** - If MCP connection seems stuck

## Documentation References

- [Chrome DevTools MCP npm package](https://www.npmjs.com/package/chrome-devtools-mcp)
- [Chrome DevTools MCP official blog](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [GitHub repository](https://github.com/ChromeDevTools/chrome-devtools-mcp/)
- [Setup guide for Claude Code](https://github.com/haasonsaas/claude-code-browser-mcp-setup)
- [Authentication setup guide](https://raf.dev/blog/chrome-debugging-profile-mcp/)

## Next Steps

1. Launch debug Chrome: `pnpm debug:chrome`
2. Navigate to your development app
3. Tell Claude Code to inspect errors or debug issues
4. Enjoy automated browser debugging! 🎉
