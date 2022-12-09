const fs = require('node:fs');
require('../bin/dev-server').start(() => fs.writeFileSync('./.dev-server-ready', ''));
