const fs = require('fs');
const path = require('path');
const http = require('http');
const del = require('del');
const mkdirp = require('mkdirp');

const vendorsDir = path.resolve(__dirname, '../src/vendors');
const vendors = require(path.join(vendorsDir, 'vendors.json'));

const rTrailingSlash = /\/$/;
const hasTrailingSlash = function (url) {
    return Boolean(url.match(rTrailingSlash));
};

const getFileUrl = function (vendor, file) {
    let url = vendor.url;
    if (!hasTrailingSlash(vendor.url)) {
        url = vendor.url + '/';
    }
    return url + file;
};

const getResultError = function (res) {
    const statusCode = res.statusCode;
    const requestPath = res.req.path;
    if (statusCode !== 200) {
        return new Error(`Request Failed [${statusCode}]: ${requestPath}`);
    }
};

vendors.forEach((vendor) => {
    // Clear out current vendor files, if any.
    const destDir = path.join(vendorsDir, vendor.name);
    console.log(`Cleaning ${destDir}`);
    mkdirp.sync(destDir);
    del.sync([path.join(destDir, '**/*')]);

    vendor.files.forEach((file) => {
        const destFile = path.join(destDir, file);

        // Make folders to match request folder structure.
        mkdirp.sync(path.dirname(destFile));

        const fileUrl = getFileUrl(vendor, file);
        console.log(`Getting ${fileUrl}`);
        http.get(fileUrl, (res) => {
            const error = getResultError(res);
            if (error) {
                console.error(error.message);
                // Consume response data to free up memory.
                res.resume();
                return;
            }
            const destStream = fs.createWriteStream(destFile);
            res.pipe(destStream);
            res.on('end', () => {
                console.log(`Finished: ${fileUrl} > ${destFile}`);
            });
        });
    });
});
