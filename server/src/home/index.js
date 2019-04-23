// Home page:
//  - display the server's README
//  - navigate to apps' READMEs
//  - uses poor man's handmade templating
const express = require('express');
const fs = require('fs');
const marked = require('marked');
const path = require('path');

const { getDemoIP } = require('../ip');

// Build an express router
const homeRouter = express.Router();
const rootPath = path.join(__dirname, '../../..');

// Fix demo IP (so that you can query from local network)
const fixDemoIP = markup => markup.replace(/127\.0\.0\.1/g, getDemoIP());

// Github nav and local server nav require different links
const fixReadmeLinks = markup => markup.replace(/"(\.\.\/){3}README\.md"/g, '"/"');

// Retina screenshots must be displayed at 50% of their original size
const downsizeScreenshots = markup => markup.replace(/<img.+?>/g, (tag) => {
  if (!tag.match('alt="screenshot"')) {
    return tag;
  }

  return tag.replace(/src="(.+?)"/g, (_, src) => `srcset="${src} 2x"`);
});

// Markdown would convert email addresses to <a href="mailto:..."> links,
// behavior we're avoided by writting them like email_at_server.com
const nonClickableEmails = markup => markup.replace(/_at_/g, '@');

// Home page routing
homeRouter.get('/', (req, res) => {
  const { app } = req.query;

  const layoutPath = path.join(__dirname, 'templates/layout.html');
  const layout = fs.readFileSync(layoutPath, 'utf8');

  let html;
  let readme;
  let readmePath = {
    api: path.join(rootPath, 'client/web/api-observer/README.md'),
    hello: path.join(rootPath, 'client/nodejs/hello-world/README.md'),
    notepad: path.join(rootPath, 'client/web/notepad/README.md'),
    tutorial: path.join(rootPath, 'client/web/tutorial/README.md'),
  }[app];

  // Display app README
  if (readmePath) {
    readme = fs.readFileSync(readmePath, 'utf8');
    readme = marked(readme);
    readme = fixDemoIP(readme);
    readme = fixReadmeLinks(readme);
    readme = downsizeScreenshots(readme);
    readme = nonClickableEmails(readme);

    const backLinkPath = path.join(__dirname, 'templates/back_link.html');
    const backLink = fs.readFileSync(backLinkPath, 'utf8');

    html = layout.replace('{{ content }}', `${backLink}\n${readme}`);

  // Display server README
  } else {
    readmePath = path.join(__dirname, '../../README.md');
    readme = fs.readFileSync(readmePath, 'utf8');
    readme = marked(readme).replace('Description</h2>', 'Description of the example server</h2>');

    const appListPath = path.join(__dirname, 'templates/app_list.html');
    const appList = fs.readFileSync(appListPath, 'utf8');

    html = layout.replace('{{ content }}', readme.replace('</h1>', `</h1>\n${appList}`));
  }

  res.send(html);
});

// Serve favicon
homeRouter.use('/favicon.ico', express.static(path.join(rootPath, 'server/src/home/favicon.ico')));

// Serve highlight.js files
homeRouter.use('/highlight', express.static(path.join(rootPath, 'server/public/highlight')));

// Serve images from the api-observer README
homeRouter.use('/pics', express.static(path.join(rootPath, 'client/web/api-observer/pics')));

module.exports = homeRouter;
