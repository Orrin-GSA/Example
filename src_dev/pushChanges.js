const { execSync } = require('child_process');

function runCommand(command) {
    console.log('');
    console.log('----------------------');
    console.log('RUNNING: ' + command);
    console.log('');
    execSync(command, { stdio: 'inherit' });
}

// NOTE: SET is windows specific, and the lack of space between 'development' and '&&' is intentional.
runCommand('SET NODE_ENV=development&& npm run clean_build');
runCommand('npm run gpush');
