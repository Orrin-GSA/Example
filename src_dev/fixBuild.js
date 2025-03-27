/* Script fixes an issue in the output from parcel. Something in google's HtmlService has changed, and it for some reason is still detecting </script> and <-- --> (html comments) within strings and comments in the JS.
    So as a hacky workaround, this moves the js to a html files of it's own, strips out any script and html comment-like text. (the only string script block I think is for legacy browsers, which should never be an issue).
*/

var fs = require('fs');
fs.readFile('dist/index.js', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    var result = data.replace(/<script><\/\\script>/g, '');
    result = result.replace(/<script><\/script>/g, '');
    result = result.replace(/--->/g, '');
    result = result.replace(/<---/g, '');

    result = '<script type="module">' + result + "</script>";

    fs.writeFile('dist/index.js', result, 'utf8', function (err) {
        if (err) return console.log(err);

        fs.rename('dist/index.js', 'dist/index.js.html', function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });
});

fs.readFile('dist/index.html', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    var result = data.replace('<script type="module" src="/index.js"></script>', '<?!= include("index.js"); ?>');

    fs.writeFile('dist/index.html', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});