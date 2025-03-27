const { execSync } = require('child_process');
var fs = require('fs');

const deploymentId = '<key required>';
const deployScript = `clasp deploy --description Production --deploymentId ${deploymentId}`;

function runCommand(command) {
    console.log('');
    console.log('----------------------');
    console.log('RUNNING: ' + command);
    console.log('');
    execSync(command, { stdio: 'inherit' });
}

runCommand('npm run build');
runCommand('npm run gpush');
runCommand(deployScript);