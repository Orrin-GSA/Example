const { execSync } = require('child_process');
var fs = require('fs');

const deploymentId = 'AKfycbxRgMB7nUW9TWKN5jj8HygVqhQQ3l9dt6kIaSxL8CLH2zjj6sH700dcxu3j1NNIT5TAEg';
const deployScript = `clasp deploy --description Development --deploymentId ${deploymentId}`;

function runCommand(command) {
    console.log('');
    console.log('----------------------');
    console.log('RUNNING: ' + command);
    console.log('');
    execSync(command, { stdio: 'inherit' });
}

// Adds link to point to the DEV PO&A API.
fs.writeFileSync('./src/files/constants.ts', `
//@ts-ignore
const waldo_api_base_url = "https://script.google.com/a/macros/gsa.gov/s/AKfycbw8WdtHszL9Xd0vAVtIa5RpMGiW_o6ml7pwaCqjpnV2WbXMbGblc3okECG4br1Cy8fCnw/exec";
//@ts-ignore
const waldo_title_suffix = " Dev";
//@ts-ignore
const isDevelopment = true;
`);

runCommand('npm run build_dev');
runCommand('npm run gpush');
runCommand(deployScript);

fs.writeFileSync('./src/files/constants.ts', `
//@ts-ignore
const waldo_api_base_url = "<use publish scripts>";
//@ts-ignore
const waldo_title_suffix = "<use publish scripts>";
//@ts-ignore
const isDevelopment = false;
`);