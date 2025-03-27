const { execSync } = require('child_process');
var fs = require('fs');

const deploymentId = 'AKfycbyI3w1BLdPRwJC2_-QwJnd6zgPR_mExGO59lou34-FrZHC8Z2-_WiZ56fcJigg81q5IkQ';
const deployScript = `clasp deploy --description Test --deploymentId ${deploymentId}`;

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
const waldo_title_suffix = " Test";
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
