# SK8 Customer Demos

This repository contains a **demo generator system** for creating customized SK8 integration demos for prospects.

## Quick Start - New Prospect Demo

When a user says something like:
- "Create a demo for [Company] https://company.com"
- "New prospect: [Company]"

**Follow this workflow:**

1. **Research** - Analyze the prospect's website:
   - Extract brand colors (primary, secondary, light, hover)
   - Determine industry and relevant integrations
   - Identify if they need dark or light theme
   - Read `_generator/prompts/research.md` for full guidance

2. **Create Config** - Generate `prospects/<slug>/config.json`:
   - Use `prospects/nimble/config.json` or `prospects/torq/config.json` as examples
   - Schema defined in `_generator/config.schema.json`

3. **Get Logo** - Ask user for the actual logo file:
   - **NEVER hand-draw logos** - always use actual company files
   - Save to `prospects/<slug>/assets/logo.png` or `logo.svg`
   - For dark themes, CSS filter handles color inversion

4. **Build** - Run the generator:
   ```bash
   node _generator/build.js <slug>
   ```

5. **QA** - Validate output per `_generator/prompts/qa.md`:
   - Check all integrations match config across ALL pages
   - Verify theme contrast (especially dark mode)
   - Confirm logo displays correctly

6. **Deploy** - Push to Vercel:
   ```bash
   cd output/sk8-<slug>-demo && npx vercel --prod --yes
   ```

## Key Files

| File | Purpose |
|------|---------|
| `_generator/build.js` | Main build script |
| `_generator/config.schema.json` | Config validation schema |
| `_generator/prompts/orchestrator.md` | Full workflow documentation |
| `_generator/prompts/research.md` | Research agent instructions |
| `_generator/prompts/qa.md` | QA checklist |
| `_generator/templates/` | HTML/CSS templates |
| `_generator/assets/integrations/` | Integration icons (SVG) |
| `prospects/<slug>/config.json` | Prospect-specific config |
| `prospects/<slug>/assets/` | Prospect logo and assets |
| `output/sk8-<slug>-demo/` | Generated demo (gitignored) |

## Config Options

```json
{
  "prospect": {
    "name": "Company Name",
    "slug": "company-slug",
    "logoType": "image",        // "text" or "image"
    "logoImage": "logo.png"     // if image type
  },
  "branding": {
    "theme": "dark",            // "light" or "dark"
    "primaryColor": "#00a6c1",
    "secondaryColor": "#a618e9",
    "lightColor": "#1a3a3f",
    "hoverColor": "#008a9e"
  },
  "integrations": {
    "category": "Connector",    // or "Source", "Integration"
    "categoryPlural": "Connectors",
    "items": [
      { "name": "CrowdStrike", "type": "EDR", "icon": "crowdstrike.svg", "description": "..." }
    ]
  }
}
```

## Available Integration Icons

Check `_generator/assets/integrations/` for available icons. Add new SVGs there for new integrations.

## Existing Prospects

- `nimble` - Light theme, data delivery focus
- `torq` - Dark theme, security/SOAR focus
