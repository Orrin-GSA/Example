const fs = require('fs');
const path = require('path');
const axios = require('axios');
const oauthToken = 'Your_Google_Token';
const dbConfigFileID = ''
const dbConfigFolderID = ''
const googleEndpoint = 'https://script.google.com/a/macros/gsa.gov/s/AKfycbwdcyd6CaekW2h5RcFuyAwdxHTYVvQH8OEIBPHemdGsNejolnZQWAJEbXIkIxE5KyttGg/exec';

// script: https://script.google.com/home/projects/1_coOVHf_6bUCpkoI3ykMMmoosbkPwvX0sYAnXPCBDPEPFpK4_eOH-dT5/edit
/**
 * Makes a GET request to the Google Apps Script endpoint using the provided OAuth token.
 * Then writes the retrieved data to src_dev/settings/dbConfig.json.
 */
async function getDataWithToken() {
  try {
    // Build the request URL with query parameters.
    const url = googleEndpoint +"?id=" + encodeURIComponent(dbConfigFileID) +"&folder=" + encodeURIComponent(dbConfigFolderID);

    // GET request with the OAuth token in the Authorization header.
    const response = await axios.get(url, {
      headers: {'Authorization': `Bearer ${oauthToken}`}
    });

    // If the response is an object and indicates an error, log the error and exit.
    if (response.data && typeof response.data === 'object' && response.data.error
    ) {
      console.error('Error from Google webhook:', response.data.message);
      return;
    }

    // Determine what to write to the file.
    // If the response data is an object, print it as JSON.
    const contentToWrite = (typeof response.data === 'object')
      ? JSON.stringify(response.data, null, 2)
      : response.data;

    // Define the file path.
    const filePath = path.join(__dirname, 'src_dev', 'settings', 'dbConfig.json');

    // Write the content to the file.
    fs.writeFileSync(filePath, contentToWrite, 'utf8');
    console.log(`Updated file at ${filePath}`);
  } catch (error) {
    // Log detailed error information.
    if (error.response && error.response.data) {
      console.error('Error during GET request:', error.response.data);
    } else {
      console.error('Error during GET request:', error.message);
    }
  }
}

(async () => {
  await getDataWithToken();
})();