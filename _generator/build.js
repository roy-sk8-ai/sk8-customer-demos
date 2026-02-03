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

// Default data objects by integration type
const DEFAULT_DATA_OBJECTS = {
  // Data Warehouses
  'Data Warehouse': [
    { name: 'CUSTOMERS', description: 'Customer master data', volume: '~500K records' },
    { name: 'ORDERS', description: 'Transaction history', volume: '~2.1M/month' },
    { name: 'ANALYTICS_EVENTS', description: 'User behavior tracking', volume: '~5M/month' },
    { name: 'PRODUCTS', description: 'Product catalog', volume: '~50K records' }
  ],
  'Lakehouse': [
    { name: 'CUSTOMERS', description: 'Customer master data', volume: '~500K records' },
    { name: 'ORDERS', description: 'Transaction history', volume: '~2.1M/month' },
    { name: 'ANALYTICS_EVENTS', description: 'User behavior tracking', volume: '~5M/month' },
    { name: 'PRODUCTS', description: 'Product catalog', volume: '~50K records' }
  ],
  // EDR
  'EDR': [
    { name: 'Detection Events', description: 'Endpoint alerts and detections', volume: '~2.1M/month' },
    { name: 'Host Information', description: 'Device inventory and status', volume: '~50K records' },
    { name: 'Incident Reports', description: 'Security incidents', volume: '~10K/month' },
    { name: 'Threat Intel', description: 'IOCs and threat indicators', volume: '~100K records' }
  ],
  // SIEM
  'SIEM': [
    { name: 'Security Logs', description: 'Aggregated security events', volume: '~10M/month' },
    { name: 'Correlation Alerts', description: 'Rule-based alert triggers', volume: '~500K/month' },
    { name: 'User Activity', description: 'Authentication and access logs', volume: '~5M/month' },
    { name: 'Network Events', description: 'Traffic and connection data', volume: '~20M/month' }
  ],
  // CRM
  'CRM': [
    { name: 'Leads', description: 'Sales leads and prospects', volume: '~100K records' },
    { name: 'Opportunities', description: 'Sales pipeline deals', volume: '~50K records' },
    { name: 'Accounts', description: 'Company records', volume: '~25K records' },
    { name: 'Contacts', description: 'Contact information', volume: '~200K records' }
  ],
  // ITSM
  'ITSM': [
    { name: 'Incidents', description: 'IT incident tickets', volume: '~50K/month' },
    { name: 'Changes', description: 'Change requests', volume: '~5K/month' },
    { name: 'Problems', description: 'Problem records', volume: '~2K/month' },
    { name: 'Assets', description: 'CMDB assets', volume: '~100K records' }
  ],
  // Object Storage
  'Object Storage': [
    { name: 'Log Files', description: 'Application and system logs', volume: '~1TB/month' },
    { name: 'Data Exports', description: 'Scheduled data exports', volume: '~500GB/month' },
    { name: 'Backups', description: 'System backups', volume: '~2TB/month' },
    { name: 'Media Files', description: 'Documents and media', volume: '~100GB/month' }
  ],
  // Webhook/REST (generic)
  'Webhook/REST': [
    { name: 'Events', description: 'Real-time event stream', volume: '~1M/month' },
    { name: 'Entities', description: 'Core business objects', volume: '~100K records' },
    { name: 'Transactions', description: 'Transaction records', volume: '~500K/month' },
    { name: 'Metadata', description: 'System metadata', volume: '~10K records' }
  ],
  // Ticketing/Support
  'Ticketing': [
    { name: 'Tickets', description: 'Support tickets and cases', volume: '~100K/month' },
    { name: 'Conversations', description: 'Customer conversations', volume: '~500K/month' },
    { name: 'Agents', description: 'Support agent data', volume: '~500 records' },
    { name: 'Customers', description: 'Customer profiles', volume: '~1M records' }
  ],
  // Email
  'Email': [
    { name: 'Messages', description: 'Email messages and threads', volume: '~2M/month' },
    { name: 'Contacts', description: 'Email contacts', volume: '~500K records' },
    { name: 'Labels', description: 'Email labels and folders', volume: '~1K records' },
    { name: 'Attachments', description: 'Email attachments metadata', volume: '~500K/month' }
  ],
  // Messaging
  'Messaging': [
    { name: 'Messages', description: 'Chat messages', volume: '~5M/month' },
    { name: 'Channels', description: 'Channels and groups', volume: '~10K records' },
    { name: 'Users', description: 'User profiles', volume: '~50K records' },
    { name: 'Reactions', description: 'Message reactions', volume: '~1M/month' }
  ]
};

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

  // Theme handling - process conditional blocks
  const theme = config.branding.theme || 'light';
  if (theme === 'dark') {
    // Keep dark theme blocks, remove light theme blocks
    result = result.replace(/\{\{#theme-dark\}\}([\s\S]*?)\{\{\/theme-dark\}\}/g, '$1');
    result = result.replace(/\{\{#theme-light\}\}[\s\S]*?\{\{\/theme-light\}\}/g, '');
  } else {
    // Keep light theme blocks, remove dark theme blocks
    result = result.replace(/\{\{#theme-light\}\}([\s\S]*?)\{\{\/theme-light\}\}/g, '$1');
    result = result.replace(/\{\{#theme-dark\}\}[\s\S]*?\{\{\/theme-dark\}\}/g, '');
  }

  // Theme variable replacement
  result = result.replace(/\{\{branding\.theme\}\}/g, theme);

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

  // Logo handling - text or image
  if (config.prospect.logoType === 'image' && config.prospect.logoImage) {
    // Replace text logo with image logo in sidebar
    result = result.replace(
      /<span class="sidebar-logo-text">NIMB<span class="logo-l">L<\/span>E<\/span>/g,
      `<img src="../assets/${config.prospect.logoImage}" alt="${config.prospect.name}" class="sidebar-logo-img" style="height: 24px;">`
    );
    // Also handle direct NIMBLE text replacement
    result = result.replace(/NIMB<span class="logo-l">L<\/span>E/g,
      `<img src="assets/${config.prospect.logoImage}" alt="${config.prospect.name}" class="sidebar-logo-img" style="height: 24px;">`
    );
  } else if (config.prospect.logoType === 'text' && config.prospect.logoHighlightLetters) {
    const logoText = config.prospect.logoText || config.prospect.name.toUpperCase();
    const highlight = config.prospect.logoHighlightLetters;
    const highlightedLogo = logoText.replace(new RegExp(`(${highlight})`, 'g'), '<span class="logo-l">$1</span>');
    result = result.replace(/NIMB<span class="logo-l">L<\/span>E/g, highlightedLogo);
  } else {
    // Plain text logo without highlight
    result = result.replace(/NIMB<span class="logo-l">L<\/span>E/g, config.prospect.name.toUpperCase());
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

  // Replace default integration names with config integrations throughout all pages
  // NOTE: This must run BEFORE card generation so it only affects hardcoded template text
  // Map the first 4 config integrations to replace default ones
  const items = config.integrations.items;
  if (items && items.length >= 1) {
    // Replace Snowflake references with first integration
    result = result.replace(/Snowflake Production/g, `${items[0].name} Production`);
    result = result.replace(/Snowflake/g, items[0].name);
    result = result.replace(/snowflake\.svg/g, items[0].icon);
  }
  if (items && items.length >= 2) {
    // Replace BigQuery references with second integration
    result = result.replace(/BigQuery Analytics/g, `${items[1].name} Analytics`);
    result = result.replace(/BigQuery/g, items[1].name);
    result = result.replace(/bigquery\.svg/g, items[1].icon);
  }
  if (items && items.length >= 3) {
    // Replace S3 references with third integration
    result = result.replace(/S3 Data Lake/g, `${items[2].name} Data Lake`);
    result = result.replace(/AWS S3/g, items[2].name);
    result = result.replace(/S3(?![a-zA-Z])/g, items[2].name);
    result = result.replace(/s3\.svg/g, items[2].icon);
  }
  if (items && items.length >= 4) {
    // Replace API/Webhook references with fourth integration
    result = result.replace(/Internal Analytics API/g, `${items[3].name} API`);
    result = result.replace(/Custom API \/ Webhook/g, items[3].name);
    result = result.replace(/api\.svg/g, items[3].icon);
  }

  // Generate data objects from config or defaults
  if (result.includes('{{#dataObjects}}')) {
    // Get the first integration's data objects (for the select-data page)
    const firstIntegration = items && items[0];
    let dataObjects = [];

    if (firstIntegration) {
      // Use config data objects if defined, otherwise use defaults based on type
      dataObjects = firstIntegration.dataObjects || DEFAULT_DATA_OBJECTS[firstIntegration.type] || [];
    }

    let dataObjectsHtml = '';
    dataObjects.forEach((obj, index) => {
      const isSelected = index < 4; // Select first 4 by default
      const statusBadge = isSelected ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Available</span>';
      dataObjectsHtml += `
            <label class="card selection-card${isSelected ? ' selected' : ''}" onclick="this.classList.toggle('selected')">
              <input type="checkbox"${isSelected ? ' checked' : ''}>
              <div class="checkbox-indicator"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
              <div class="selection-content">
                <div class="selection-title">${obj.name}</div>
                <div class="selection-meta">${obj.description || ''} &bull; ${obj.volume || ''}</div>
              </div>
              ${statusBadge}
            </label>`;
    });
    result = result.replace(/\{\{#dataObjects\}\}[\s\S]*?\{\{\/dataObjects\}\}/g, dataObjectsHtml);
  }

  // Sync terminology replacements (delivery → sync)
  // Be careful with word boundaries and capitalization
  result = result.replace(/Data Delivery Overview/g, 'Data Sync Overview');
  result = result.replace(/Delivery Overview/g, 'Sync Overview');
  result = result.replace(/Delivery History/g, 'Sync History');
  result = result.replace(/Delivery Settings/g, 'Sync Settings');
  result = result.replace(/Delivery Frequency/g, 'Sync Frequency');
  result = result.replace(/Delivery Details/g, 'Sync Details');
  result = result.replace(/Delivery Timeline/g, 'Sync Timeline');
  result = result.replace(/Delivery Logs/g, 'Sync Logs');
  result = result.replace(/Delivery ID/g, 'Sync ID');
  result = result.replace(/delivery job/g, 'sync job');
  result = result.replace(/Delivery job/g, 'Sync job');
  result = result.replace(/delivery completed/g, 'sync completed');
  result = result.replace(/Delivery completed/g, 'Sync completed');
  result = result.replace(/View Delivery Dashboard/g, 'View Sync Dashboard');
  result = result.replace(/Pause Delivery/g, 'Pause Sync');
  result = result.replace(/Retry Delivery/g, 'Retry Sync');
  result = result.replace(/Recent Deliveries/g, 'Recent Syncs');
  result = result.replace(/Total Deliveries/g, 'Total Syncs');
  result = result.replace(/Data Delivery/g, 'Data Sync');
  result = result.replace(/Initial Data Delivery/g, 'Initial Data Sync');
  result = result.replace(/Data delivered/gi, 'Data synced');
  result = result.replace(/data delivered/gi, 'data synced');
  result = result.replace(/Records Delivered/g, 'Records Synced');
  result = result.replace(/records delivered/g, 'records synced');
  result = result.replace(/delivery status/g, 'sync status');
  result = result.replace(/delivery configuration/g, 'sync configuration');
  result = result.replace(/delivery configurations/g, 'sync configurations');
  result = result.replace(/ delivered/g, ' synced');
  result = result.replace(/ deliveries/g, ' syncs');
  result = result.replace(/delivery_/g, 'sync_');
  result = result.replace(/del_/g, 'sync_');

  // Generate integration cards from config (AFTER all replacements to preserve card text)
  if (result.includes('{{#integrations.cards}}')) {
    let cardsHtml = '';
    for (const item of config.integrations.items) {
      const description = item.description || `Ingest ${item.type.toLowerCase()} data from ${item.name} into your platform.`;
      cardsHtml += `
          <div class="card integration-card">
            <div class="integration-icon">
              <img src="../assets/logos/${item.icon}" alt="${item.name}" width="28" height="28">
            </div>
            <div class="flex items-center gap-sm mb-sm">
              <span class="integration-name">${item.name}</span>
              <span class="badge badge-success">Available</span>
            </div>
            <p class="integration-description">${description}</p>
            <a href="02-select-account.html" class="btn btn-primary btn-sm">Connect</a>
          </div>`;
    }
    result = result.replace(/\{\{#integrations\.cards\}\}/g, cardsHtml);
  }

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
    // Image logo - use logoImage from config or default to logo.png
    const logoFile = config.prospect.logoImage || 'logo.png';
    template = template.replace(/\{\{\#prospect\.logoHtml\}\}[\s\S]*?\{\{\/prospect\.logoHtml\}\}/g, '');
    template = template.replace(/\{\{\^prospect\.logoHtml\}\}[\s\S]*?\{\{\/prospect\.logoHtml\}\}/g,
      `<img src="app-ui/assets/${logoFile}" alt="${config.prospect.name}" class="logo-image">`);
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
