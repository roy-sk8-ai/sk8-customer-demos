#!/usr/bin/env node

/**
 * SK8 Demo Generator
 *
 * Usage: node build.js <prospect-slug>
 * Example: node build.js nimble
 *
 * Reads config from prospects/<slug>/config.json
 * Outputs to output/sk8-<slug>-demo/
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const ASSETS_DIR = path.join(__dirname, 'assets');
const PROSPECTS_DIR = path.join(ROOT, 'prospects');
const OUTPUT_DIR = path.join(ROOT, 'output');

// Get prospect slug from command line
const prospectSlug = process.argv[2];

if (!prospectSlug) {
  console.error('Usage: node build.js <prospect-slug>');
  console.error('Example: node build.js nimble');
  process.exit(1);
}

// Load config
const configPath = path.join(PROSPECTS_DIR, prospectSlug, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error(`Config not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log(`Building demo for: ${config.prospect.name}`);

// Output directory
const outputDir = path.join(OUTPUT_DIR, `sk8-${prospectSlug}-demo`);

// Clean and create output directory
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// Create app-ui directory structure
const appUiDir = path.join(outputDir, 'app-ui');
fs.mkdirSync(path.join(appUiDir, 'assets', 'logos'), { recursive: true });
fs.mkdirSync(path.join(appUiDir, 'wf4-pipeline'), { recursive: true });
fs.mkdirSync(path.join(appUiDir, 'wf5-manage-connections'), { recursive: true });
fs.mkdirSync(path.join(appUiDir, 'wf6-sync-history'), { recursive: true });

/**
 * Replace template variables in content
 */
function processTemplate(content, config) {
  let result = content;

  // Brand colors
  result = result.replace(/--nimble-purple:\s*#[0-9a-fA-F]+/g, `--brand-primary: ${config.branding.primaryColor}`);
  result = result.replace(/--nimble-purple-light:\s*#[0-9a-fA-F]+/g, `--brand-primary-light: ${config.branding.lightColor}`);
  result = result.replace(/--nimble-purple-hover:\s*#[0-9a-fA-F]+/g, `--brand-primary-hover: ${config.branding.hoverColor}`);
  result = result.replace(/--nimble-lavender:\s*#[0-9a-fA-F]+/g, `--brand-secondary: ${config.branding.secondaryColor}`);

  // CSS variable references
  result = result.replace(/var\(--nimble-purple\)/g, 'var(--brand-primary)');
  result = result.replace(/var\(--nimble-purple-light\)/g, 'var(--brand-primary-light)');
  result = result.replace(/var\(--nimble-purple-hover\)/g, 'var(--brand-primary-hover)');
  result = result.replace(/var\(--nimble-lavender\)/g, 'var(--brand-secondary)');

  // Company name
  result = result.replace(/Nimble/g, config.prospect.name);
  result = result.replace(/NIMBLE/g, config.prospect.name.toUpperCase());

  // Logo text with highlight
  if (config.prospect.logoType === 'text' && config.prospect.logoHighlightLetters) {
    const logoText = config.prospect.logoText || config.prospect.name.toUpperCase();
    const highlight = config.prospect.logoHighlightLetters;
    const highlightedLogo = logoText.replace(new RegExp(`(${highlight})`, 'g'), '<span class="logo-l">$1</span>');
    result = result.replace(/NIMB<span class="logo-l">L<\/span>E/g, highlightedLogo);
  }

  // Navigation section label
  result = result.replace(/Data Delivery/g, config.navigation.sectionLabel);

  // Menu items
  const menuItems = config.navigation.menuItems;
  if (menuItems && menuItems.length >= 4) {
    result = result.replace(/Delivery Overview/g, menuItems[0].label);
    result = result.replace(/Add Source/g, menuItems[1].label);
    result = result.replace(/Active Sources/g, menuItems[2].label);
    result = result.replace(/Delivery History/g, menuItems[3].label);

    // Tooltips
    result = result.replace(/Dashboard showing all active syncs, health metrics, and recent activity/g, menuItems[0].tooltip);
    result = result.replace(/Configure a new data source: warehouse, cloud storage, or API/g, menuItems[1].tooltip);
    result = result.replace(/View and manage your connected data sources/g, menuItems[2].tooltip);
    result = result.replace(/Browse sync logs, delivery status, and historical data/g, menuItems[3].tooltip);
  }

  // Integration category
  result = result.replace(/Source(?!s)/g, config.integrations.category);
  result = result.replace(/Sources/g, config.integrations.categoryPlural);

  // Fix nimble-ui references to app-ui
  result = result.replace(/nimble-ui/g, 'app-ui');

  return result;
}

/**
 * Generate index.html with integrations
 */
function generateIndex(config) {
  let template = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

  // Simple replacements
  template = template.replace(/\{\{prospect\.name\}\}/g, config.prospect.name);
  template = template.replace(/\{\{branding\.primaryColor\}\}/g, config.branding.primaryColor);
  template = template.replace(/\{\{branding\.secondaryColor\}\}/g, config.branding.secondaryColor);
  template = template.replace(/\{\{branding\.lightColor\}\}/g, config.branding.lightColor);
  template = template.replace(/\{\{messaging\.heroTitle\}\}/g, config.messaging.heroTitle);
  template = template.replace(/\{\{messaging\.heroHighlight\}\}/g, config.messaging.heroHighlight);
  template = template.replace(/\{\{messaging\.heroSubtitle\}\}/g, config.messaging.heroSubtitle);

  // Logo
  if (config.prospect.logoType === 'text') {
    const logoText = config.prospect.logoText || config.prospect.name.toUpperCase();
    const highlight = config.prospect.logoHighlightLetters || '';
    let logoHtml;
    if (highlight) {
      logoHtml = `<span class="logo-text">${logoText.replace(new RegExp(`(${highlight})`, 'g'), '<span class="logo-highlight">$1</span>')}</span>`;
    } else {
      logoHtml = `<span class="logo-text">${logoText}</span>`;
    }
    template = template.replace(/\{\{\#prospect\.logoHtml\}\}[\s\S]*?\{\{\/prospect\.logoHtml\}\}/g, logoHtml);
    template = template.replace(/\{\{\^prospect\.logoHtml\}\}[\s\S]*?\{\{\/prospect\.logoHtml\}\}/g, '');
  } else {
    template = template.replace(/\{\{\#prospect\.logoHtml\}\}[\s\S]*?\{\{\/prospect\.logoHtml\}\}/g, '');
    template = template.replace(/\{\{\^prospect\.logoHtml\}\}[\s\S]*?\{\{\/prospect\.logoHtml\}\}/g,
      `<img src="app-ui/assets/logo.png" alt="${config.prospect.name}" class="logo-image">`);
  }

  // Integrations
  let integrationsHtml = '';
  for (const item of config.integrations.items) {
    integrationsHtml += `
      <div class="integration-card">
        <div class="integration-icon">
          <img src="app-ui/assets/logos/${item.icon}" alt="${item.name}">
        </div>
        <div class="integration-name">${item.name}</div>
        <div class="integration-type">${item.type}</div>
      </div>`;
  }
  template = template.replace(/\{\{\#integrations\.items\}\}[\s\S]*?\{\{\/integrations\.items\}\}/g, integrationsHtml);

  // Features
  let featuresHtml = '';
  if (config.features) {
    for (const feature of config.features) {
      featuresHtml += `
      <div class="feature-item">
        <div class="feature-icon">
          ${feature.icon}
        </div>
        <div class="feature-title">${feature.title}</div>
        <div class="feature-desc">${feature.description}</div>
      </div>`;
    }
  }
  template = template.replace(/\{\{\#features\}\}[\s\S]*?\{\{\/features\}\}/g, featuresHtml);

  return template;
}

/**
 * Process all HTML files in a directory
 */
function processDirectory(srcDir, destDir, config) {
  const items = fs.readdirSync(srcDir);

  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      processDirectory(srcPath, destPath, config);
    } else if (item.endsWith('.html')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = processTemplate(content, config);
      fs.writeFileSync(destPath, content);
      console.log(`  Generated: ${destPath.replace(outputDir, '')}`);
    } else if (item.endsWith('.css')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = processTemplate(content, config);
      fs.writeFileSync(destPath, content);
      console.log(`  Generated: ${destPath.replace(outputDir, '')}`);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============ Build Process ============

console.log('\\n📁 Creating directory structure...');

// Generate index.html
console.log('\\n📄 Generating index.html...');
const indexHtml = generateIndex(config);
fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
console.log('  Generated: /index.html');

// Process styles.css
console.log('\\n🎨 Processing styles.css...');
let stylesContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'styles.css'), 'utf8');
stylesContent = processTemplate(stylesContent, config);
// Replace template placeholders in CSS
stylesContent = stylesContent.replace(/\{\{branding\.primaryColor\}\}/g, config.branding.primaryColor);
stylesContent = stylesContent.replace(/\{\{branding\.secondaryColor\}\}/g, config.branding.secondaryColor);
stylesContent = stylesContent.replace(/\{\{branding\.lightColor\}\}/g, config.branding.lightColor);
stylesContent = stylesContent.replace(/\{\{branding\.hoverColor\}\}/g, config.branding.hoverColor || config.branding.primaryColor);
stylesContent = stylesContent.replace(/\{\{prospect\.name\}\}/g, config.prospect.name);
fs.writeFileSync(path.join(appUiDir, 'styles.css'), stylesContent);
console.log('  Generated: /app-ui/styles.css');

// Process page templates
console.log('\\n📑 Processing page templates...');
processDirectory(path.join(TEMPLATES_DIR, 'pages'), appUiDir, config);

// Copy assets
console.log('\\n🖼️  Copying assets...');

// Copy SK8 favicon
fs.copyFileSync(
  path.join(ASSETS_DIR, 'sk8', 'favicon.png'),
  path.join(appUiDir, 'assets', 'favicon.png')
);
console.log('  Copied: favicon.png');

// Copy integration logos
const logosDir = path.join(ASSETS_DIR, 'integrations');
const logos = fs.readdirSync(logosDir);
for (const logo of logos) {
  fs.copyFileSync(
    path.join(logosDir, logo),
    path.join(appUiDir, 'assets', 'logos', logo)
  );
}
console.log(`  Copied: ${logos.length} integration logos`);

// Copy prospect-specific assets if they exist
const prospectAssetsDir = path.join(PROSPECTS_DIR, prospectSlug, 'assets');
if (fs.existsSync(prospectAssetsDir)) {
  const prospectAssets = fs.readdirSync(prospectAssetsDir);
  for (const asset of prospectAssets) {
    fs.copyFileSync(
      path.join(prospectAssetsDir, asset),
      path.join(appUiDir, 'assets', asset)
    );
    console.log(`  Copied prospect asset: ${asset}`);
  }
}

console.log('\\n✅ Build complete!');
console.log(`   Output: ${outputDir}`);
console.log(`\\n🚀 To deploy:`);
console.log(`   cd ${outputDir}`);
console.log(`   npx vercel --prod --yes`);
