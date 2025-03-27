const fs = require('fs');
const path = require('path');
const axios = require('axios');
const oauthToken = 'Your_Google_Token';
const dbConfigFileID = ''
const dbConfigFolderID= ''
const googleEndpoint = 'https://script.google.com/a/macros/gsa.gov/s/AKfycbwdcyd6CaekW2h5RcFuyAwdxHTYVvQH8OEIBPHemdGsNejolnZQWAJEbXIkIxE5KyttGg/exec';

// script: https://script.google.com/home/projects/1_coOVHf_6bUCpkoI3ykMMmoosbkPwvX0sYAnXPCBDPEPFpK4_eOH-dT5/edit

/**
 * Reads the local dbConfig.json file and uploads its content to the Google Apps Script endpoint.
 */
async function uploadFile() {
  try {
    // Build the path to the local dbConfig.json file
    const filePath = path.join(__dirname, 'src_dev', 'settings', 'dbConfig.json');
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // POST the file content to the endpoint.
    const response = await axios.post(
      googleEndpoint + "?id=" + encodeURIComponent(dbConfigFileID) +"&folder=" + encodeURIComponent(dbConfigFolderID),fileContent,
      {headers: {'Content-Type': 'application/json','Authorization': `Bearer ${oauthToken}`}}
    );
    
    // Check the response data for an error property.
    if (response.data && response.data.error) {
      console.error('Error from Google webhook:', response.data.message);
    } else {
      console.log('Success:', response.data);
    }
  } catch (error) {
    // If the error comes with a response log the response data.
    if (error.response && error.response.data) {
      console.error('Error during file upload:', error.response.data);
    } else {
      console.error('Error during file upload:', error.message);
    }
  }
}

(async () => {
  await uploadFile();
})();
