const theme = require('./theme');
const resume = require('./resume.json');
const fs = require('fs');
fs.writeFileSync('resume.html', theme.render(resume));
