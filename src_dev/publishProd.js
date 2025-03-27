const { execSync } = require('child_process');
var fs = require('fs');

const deploymentId = 'AKfycbxVM6mBQwZYQ3kSkuJoKqJYjSNJl9dSNDcyMaWNUJnruL0Q0NnbvX0ecb-lsu9oF4gIJg';
const deployScript = `clasp deploy --description Production --deploymentId ${deploymentId}`;

function runCommand(command) {
    console.log('');
    console.log('----------------------');
    console.log('RUNNING: ' + command);
    console.log('');
    execSync(command, { stdio: 'inherit' });
}

// Adds link to point to the PROD PO&A API.
fs.writeFileSync('./src/files/constants.ts', `
//@ts-ignore
const waldo_api_base_url = "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec";
//@ts-ignore
const waldo_title_suffix = "";
//@ts-ignore
const isDevelopment = false;
`);

runCommand('npm run build');
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