/**
 * waldo_lock: https://docs.google.com/spreadsheets/d/1cshZRb2a5N1RAPE6aGbcM_7a5uuvtJp4XUt_MTJGmDM/edit#gid=0
 */
/**
 * Google Container Functions
 */

const waldo_lock_id = "1cshZRb2a5N1RAPE6aGbcM_7a5uuvtJp4XUt_MTJGmDM";
//@ts-ignore variable will be added by publish scripts process to constants.ts.
declare const waldo_api_base_url: string;
//@ts-ignore variable will be added by publish scripts process to constants.ts.
declare const waldo_title_suffix: string;
//@ts-ignore variable will be added by publish scripts process to constants.ts.
declare const isDevelopment: boolean;

const version = PropertiesService.getScriptProperties().getProperty('cache_version') ?? '0';

const UserCacheVersioned = {
  put: (key: string, value: string, expirationInSeconds: number = 600) => {
    const cache = CacheService.getUserCache();
    cache.put(`${version}_${key}`, value, expirationInSeconds);
  },
  get: (key: string) => {
    const cache = CacheService.getUserCache();
    return cache.get(`${version}_${key}`);
  },
  remove: (key: string) => {
    const cache = CacheService.getUserCache();
    return cache.remove(`${version}_${key}`);
  }
}

const ScriptCacheVersioned = {
  clearAll: () => {
    // Should make all caches, including user caches, reset.
    const strVersion = PropertiesService.getScriptProperties().getProperty('cache_version') ?? '0';
    const version = parseToInt_(strVersion, 0) + 1;
    PropertiesService.getScriptProperties().setProperty('cache_version', version.toString());
  },
  put: (key: string, value: string, expirationInSeconds: number = 600) => {
    const cache = CacheService.getScriptCache();
    cache.put(`${version}_${key}`, value, expirationInSeconds);
  },
  get: (key: string) => {
    const cache = CacheService.getScriptCache();
    return cache.get(`${version}_${key}`);
  },
  remove: (key: string) => {
    const cache = CacheService.getScriptCache();
    return cache.remove(`${version}_${key}`);
  }
}

export function saveFeedback(feedbackType: string, feedbackText: string) {
  if (typeof SpreadsheetApp !== 'undefined') {
    const ss = SpreadsheetApp.openById('1sv5UXlhsnxgnxPhzQiOZibu_gxqOqDfHVTWh4R4pTH0');
    const sheet = ss.getSheetByName('Feedback');
    const userEmail = getUserEmail(); 
    sheet.appendRow([new Date(), userEmail, feedbackType, feedbackText]);
  } else {
    console.log("Local test: feedback to be saved:", feedbackType, feedbackText);
  }
}


function doGet(e: GoogleAppsScript.Events.DoGet) {
  const htmlTemplate = HtmlService.createTemplateFromFile("index.html");
  htmlTemplate.params = e?.queryString ?? '';
  htmlTemplate.sourceMap = '//# sourceURL=main.js';

  return htmlTemplate
    .evaluate()
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setTitle('WALDO' + waldo_title_suffix)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl('https://www.gsa.gov/sites/gsa.gov/themes/custom/gsa/logo.png');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

function getDataFromSheet_() {
  let ss = SpreadsheetApp.openById("1fTLGJv7BFURchFdx4nmcG4sfO9gXJ3BVGMCplHyHWb4");
  let sheet = ss.getSheetByName("Sheet26")!; // Replace "Sheet1" with the name of your sheet
  let data = sheet.getRange("A1").getValue(); // Fetch data from cell A1, for example

  return data; // Return the fetched data
}

function serverCheck() {
  return ("Running in the Google Container");
}

function getIsAdmin() {
  const userCache = UserCacheVersioned;
  const key = 'isAdmin';

  const cached = userCache.get(key);
  if (cached != null) {
    return cached === 'true';
  }

  let isAdmin = false;
  let userEmail = getUserEmail()?.toLocaleLowerCase();
  if (!userEmail) {
    userCache.put(key, isAdmin.toString().toLocaleLowerCase(), 60 * 60 * 24);
    return false;
  }

  const scriptCache = ScriptCacheVersioned;
  let cachedAdmins = scriptCache.get('admins');

  let admins: string[];
  if (cachedAdmins == null) {
    admins = updateAdminCache_();
  }
  else {
    admins = cachedAdmins.split(',');
  }

  isAdmin = admins.includes(userEmail);

  userCache.put(key, isAdmin.toString().toLocaleLowerCase(), 60 * 60 * 24);
  return isAdmin;
}

// Get any user details in bulk.
function getUserDetails() {
  const result = { name: '', email: '', isAdmin: false };

  result.name = getUserName();
  result.email = getUserEmail();
  result.isAdmin = getIsAdmin();

  return result;
}

function updateAdminCache_() {
  const scriptCache = ScriptCacheVersioned;
  // Lookup user spreadsheet and search roles.
  const users = server_fetchPoaTeam_();

  const admins: string[] = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.email && user.roles?.toLocaleLowerCase().includes('admin')) {
      admins.push(user.email.trim().replaceAll(' ', '').toLocaleLowerCase());
    }
  }

  scriptCache.put('admins', admins.join(','), 60 * 60 * 24);
  return admins;
}

// The idea is this is called by someone who is already an admin to reset the cache for someone who is newly added as an admin. They can also just wait the 24 hours for the cache to reacquire.
// TODO: Do we also want an "owner" role that is for owners of the app (IE anyone who publishes the app), so owners can reset the cache but don't technically have admin access?
function resetAdminCache() {
  const isAdmin = getIsAdmin();
  if (isAdmin) {
    ScriptCacheVersioned.clearAll();
    updateAdminCache_();
  }
  else {
    console.error(`Tried to reset admin cache but user ${getUserEmail()} is not an admin.`);
  }
}

// fetch a google doc email template
function getHTMLDoc(docName, folderId) {
  try {
    let folder = DriveApp.getFolderById(folderId);
    let files = folder.getFilesByName(docName);

    if (!files.hasNext()) {
      Logger.log("Document not found: " + docName);
      return null;
    }

    let file = files.next();
    let docId = file.getId();

    let url = "https://docs.google.com/feeds/download/documents/export/Export?id=" + docId + "&exportFormat=html";
    let options = {
      method: "get",
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    } as const; // had to add this to keep ts happy

    let response = UrlFetchApp.fetch(url, options);
    let htmlContent = response.getContentText();
    return (htmlContent ? htmlContent : "Not Found");
  } catch (err) {
    console.log("error fetching doc template");
    return "Not Found";
  }
}

function sendSupportEmail(type, project, to, cc, test) {
  let emailbody = '';
  let subject = '';
  if (test) {
    to = getUserEmail();
    cc = getUserEmail();
  }
  const folderID = "1inDuoOCsZ1mfe3jfmlpHv5klt55f9fnA";
  switch (type) {
    case "project_assignment":
      subject = project.ID + " - " + project.name + " has been assigned to you";
      // for some reason type script was bugging me that getHTMLDoc could return null
      emailbody = (getHTMLDoc(type, folderID) || "").replaceAll("&lt;project&gt;", project.name);
      emailbody = emailbody.replaceAll("&lt;developers&gt;", to);
      emailbody = emailbody.replaceAll("&lt;description&gt;", (project.description ? project.description : "N/A"));
      break;
    case "bug_assignment":
      subject = "RPA Support Ticket " + project.ID + " - " + project.name + " has been assigned to you";
      emailbody = (getHTMLDoc(type, folderID) || "").replaceAll("&lt;project&gt;", project.name);
      emailbody = emailbody.replaceAll("&lt;developers&gt;", to);
      emailbody = emailbody.replaceAll("&lt;description&gt;", (project.description ? project.description : "N/A"));
      break;
    case "bug_closed":
      subject = project.ID + " - " + project.name + " has been CLOSED";
      emailbody = (getHTMLDoc(type, folderID) || "").replaceAll("&lt;project&gt;", project.name);
      emailbody = emailbody.replaceAll("&lt;developers&gt;", to);
      emailbody = emailbody.replaceAll("&lt;description&gt;", (project.description ? project.description : "N/A"));
      break;
    default:
      console.error("Send email type", type, "was not found. Ensure the doc name is in this folder:", folderID);
      return;
  }
  emailbody = emailbody.replaceAll(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  Logger.log(emailbody);
  GmailApp.sendEmail(to, subject, "", {
    from: "rpaoffice@gsa.gov",
    htmlBody: emailbody,
    cc: cc
  });
  console.log("email test");
}

// Placeholders
function createGitHubIssue() {
  var token = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"; // Replace with your token
  var owner = "your-github-username"; // Replace with repository owner
  var repo = "your-repo-name"; // Replace with repository name

  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/issues";

  var payload = {
    title: "New Issue from API",
    body: "This issue was created via GitHub API.",
    labels: ["bug"] // Optional labels
  };

  var options = {
    method: "post",
    headers: {
      "Authorization": "token " + token,
      "Accept": "application/vnd.github+json"
    },
    contentType: "application/json",
    payload: JSON.stringify(payload)
  } as const;

  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}

function postUpdate(payload) {
  const urlApiPost = waldo_api_base_url;
  try {
    let options = {
      method: "post",
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    } as any;

    let res = JSON.parse(UrlFetchApp.fetch(urlApiPost, options).getContentText());

    Logger.log(res);
    return res;
  } catch (error: any) {
    console.error(error);
    return [];
  }
}

function checkLockProjects() {
  let jsonData: Record<string, any>[] = [];

  try {
    let spreadsheet = SpreadsheetApp.openById(waldo_lock_id);
    let sheet = spreadsheet.getSheets()[0];
    let range = sheet.getDataRange();
    let values = range.getValues();

    let keys = values[0];

    for (var i = 1; i < values.length; i++) {
      let row = values[i];
      let obj: Record<string, any> = {};
      for (var j = 0; j < row.length; j++) {
        obj[keys[j]] = row[j];
      }
      jsonData.push(obj);
    }
  }
  catch (err: any) {
    Logger.log("Error while converting to JSON: '" + err.message + "'\n id was: " + waldo_lock_id);
  } finally {
    let jsonString = JSON.stringify(jsonData);
    Logger.log(jsonString);
    return jsonString;
  }
}

function editAddLockProjects(rpaID, clearUser) {
  // clearUser = true;
  try {
    //remove possible duplicates 
    //removeDuplicates(waldo_lock_id);
    //removeDupRPAID(waldo_lock_id);

    let sheet = SpreadsheetApp.openById(waldo_lock_id).getActiveSheet();
    rpaID = 'RPA-22031';
    let found = false;
    let dataRange = sheet.getDataRange();
    let values = dataRange.getValues();

    let idIndex = values[0].indexOf('ID');
    let timeStampIndex = values[0].indexOf('timestamp');
    let userIndex = values[0].indexOf('user');
    let date = "";
    let user = "";
    if (!clearUser) {
      user = Session.getActiveUser().getEmail();
      date = new Date().toString();
    }

    if (idIndex == -1 || userIndex == -1 || timeStampIndex == -1) {
      throw new Error('One or more waldo_lock headers are missing.');
    }

    for (var i = 1; i < values.length; i++) {
      if (values[i][idIndex] == rpaID) {
        sheet.getRange(i + 1, userIndex + 1).setValue(user);
        sheet.getRange(i + 1, timeStampIndex + 1).setValue(date);
        found = true;
        break;
      }
    }
    //if waldo_lock doesn't have a project, add it
    if (!found) {
      let newRow: any[] = [];
      newRow[idIndex] = rpaID;
      newRow[timeStampIndex] = date;
      newRow[userIndex] = user;
      sheet.appendRow(newRow);
    }

  } catch (err: any) {
    Logger.log("Error while attempting to Edit/Add to the waldo_lock table " + err.message);
  }
}

function getUserEmail() {
  let email = "";
  try {
    email = Session.getActiveUser().getEmail();
    Logger.log(email)
    return email;
  } catch (err: any) {
    Logger.log("Error fetching the user email: " + err.message);
    return email;
  }
}

function testMilestones_() {
  let options: any = {
    method: "get",
    "headers": { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    contentType: "application/json",
    muteHttpExceptions: true
  };

  let url = waldo_api_base_url + "?type=specific&table=rpa_milestones";

  let test = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  Logger.log(test.values);
}

function getUserName(): string {
  //@ts-expect-error getUsername not updated in typings
  return Session.getActiveUser().getUsername();
}

function logAuditAction(action) {
  const userName = getUserName();
  let doc = DocumentApp.openById("1xslWF3iYE2LJ22TrH_qYAONts_3CdcHKemj8fd-zPP8");
  let now = new Date();

  let localDateStr = now.toLocaleString('en-US', {
    timeZoneName: "short",
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/New_York'
  });

  const str = `${localDateStr} - ${userName}: ${action}`;
  doc.getBody().appendParagraph(str);
}

function createDocumentInFolder_(folder: GoogleAppsScript.Drive.Folder, name: string) {
  // Create file in own root.
  const doc = DocumentApp.create(name);
  const docFile = DriveApp.getFileById(doc.getId());
  // Add file to folder.
  folder.addFile(docFile);
  // Remove file from own root.
  DriveApp.getRootFolder().removeFile(docFile);
  return doc;
}

function getOrCreateDocumentInFolder_(folder: GoogleAppsScript.Drive.Folder, name: string) {
  let docFile = getFirstFile_(folder.getFilesByName(name));

  if (!docFile) {
    return createDocumentInFolder_(folder, name);
  }
  else {
    return DocumentApp.openById(docFile.getId());
  }
}

function getFirstFile_(files: GoogleAppsScript.Drive.FileIterator) {
  let result: GoogleAppsScript.Drive.File | null = null;

  while (files.hasNext()) {
    result = files.next();
    break;
  }

  return result;
}

// TODO: Don't love passing in the project folder ID.
function logProjectAuditAction(projectFolderId: string, actions: string | string[], addlContext?: string) {
  if (!projectFolderId) {
    return;
  }

  if (!actions) {
    return;
  }

  if (!Array.isArray(actions)) {
    actions = [actions];
  }

  const userName = getUserName();
  const folder = DriveApp.getFolderById(projectFolderId);
  const doc = getOrCreateDocumentInFolder_(folder, "Audit Logs");
  let now = new Date();

  let localDateStr = now.toLocaleString('en-US', {
    timeZoneName: "short",

    year: '2-digit',
    month: '2-digit',
    day: '2-digit',

    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  });

  const body = doc.getBody();
  const str = `${localDateStr} - ${userName}: The following actions were applied${addlContext ? (' ' + addlContext) : ''}`;
  const element = body.appendParagraph(str);
  const elementIdx = body.getChildIndex(element);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    body.insertListItem(elementIdx + i + 1, action)
      .setNestingLevel(0)
      .setGlyphType(DocumentApp.GlyphType.BULLET);
  };
}

function parseToInt_(arg, defaultVal = 0) {
  const number = parseInt(arg, 10);
  return Number.isNaN(number) ? defaultVal : number;
}

// Daily method called in the apps scripts to archive the log and clear it out for the next day.
function archiveAuditLogs() {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const currentMonthStr = now.toLocaleString('en-US', {
    year: "numeric",
    month: "2-digit",
    timeZone: 'America/New_York'
  });
  const yesterdayDayStr = yesterday.toLocaleString('en-US', {
    day: "2-digit",
    timeZone: 'America/New_York'
  });

  // NOTE: month is 0-based, but the above strings will display the correct month. We use yesterday because that's the day that's going to be logged.
  const logMonth = yesterday.getMonth();

  const logFileId = '1xslWF3iYE2LJ22TrH_qYAONts_3CdcHKemj8fd-zPP8';
  const logFileDoc = DocumentApp.openById(logFileId);

  if (logFileDoc.getBody().getText().length === 0) {
    // If this is true, then there is nothing to log, don't create a empty copy.
    return;
  }

  // All files are in the "PO&A Project Monitor" Shared Drive, under Audit Logs.
  const logFileDrive = DriveApp.getFileById(logFileId);
  const monthTxtFile = DriveApp.getFileById('1GOd_z9OzLH1H4Mtdjbw7SxjoWC4PoF35');
  const linkTxtFile = DriveApp.getFileById('1f1CKxLQiYz1uCkhtHmpd1UHK6QJmAYK9');

  const archiveFolder = DriveApp.getFolderById('1uruq0xJJn-Nqz6mZ_HVuaEUV-cX8_mlt');

  const archiveMonth = parseToInt_(monthTxtFile.getBlob().getDataAsString(), -1);

  let archiveMonthFolder: GoogleAppsScript.Drive.Folder;
  // If true, we've rolled over to the next month. Need to create a new audit folder for the month.
  if (archiveMonth != logMonth) {
    archiveMonthFolder = archiveFolder.createFolder(currentMonthStr)
    linkTxtFile.setContent(archiveMonthFolder.getId());
    monthTxtFile.setContent(logMonth.toString());
    console.log('Creating New Archive: ' + archiveMonthFolder.getId() + ' for month ' + logMonth);
  }
  else {
    const archiveMonthRef = linkTxtFile.getBlob().getDataAsString();
    archiveMonthFolder = DriveApp.getFolderById(archiveMonthRef);
    console.log('Using Existing Archive');
  }

  logFileDrive.makeCopy(yesterdayDayStr, archiveMonthFolder);
  logFileDoc.getBody().clear();
}

function server_fetchPoaTeam_() {
  const urlApiGetBase = waldo_api_base_url + "?type=specific";
  const urlApiGetPoaUsers = urlApiGetBase + "&table=poa_team";

  const request: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get",
    "headers": { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    contentType: "application/json",
    muteHttpExceptions: true
  };

  const result = processResponse_<PoaUser>(UrlFetchApp.fetch(urlApiGetPoaUsers, request), urlApiGetPoaUsers);

  if (!result?.values) {
    throw new Error('Invalid result object return from API.');
  }

  return result.values;
}

function server_fetchRpaDataRaw() {

  const urlApiGetBase = waldo_api_base_url + "?type=specific";
  const urlApiGetProjects = urlApiGetBase + "&table=rpa_projects";
  const urlApiGetEmployees = urlApiGetBase + "&table=employee_user";
  const urlApiGetOffice = urlApiGetBase + "&table=office";
  const urlApiGetMilestone = urlApiGetBase + "&table=project_milestones";
  const urlApiGetPoaUsers = urlApiGetBase + "&table=poa_team";
  const urlApiGetSystems = urlApiGetBase + "&table=systems";
  const urlApiGetEnhancements = urlApiGetBase + "&table=enhancements";
  const urlApiGetIdeas = urlApiGetBase + "&table=submission_idea";
  const urlApiGetBugs = urlApiGetBase + "&table=bugs";
  const urlApiGetScripts = urlApiGetBase + "&table=script_projects";
  const urlApiGetNpe = urlApiGetBase + "&table=npe";
  const urlApiGetDocuments = urlApiGetBase + "&table=documents";
  const urlApiGetTools = urlApiGetBase + "&table=it_tools";
  const urlApiGetRanking = urlApiGetBase + "&table=rankings";

  let urls = [
    urlApiGetProjects,
    urlApiGetEmployees,
    urlApiGetOffice,
    urlApiGetMilestone,
    urlApiGetPoaUsers,
    urlApiGetSystems,
    urlApiGetEnhancements,
    urlApiGetIdeas,
    urlApiGetNpe,
    urlApiGetDocuments,
    urlApiGetTools,
    urlApiGetBugs,
    urlApiGetScripts,
    urlApiGetRanking,
  ];

  let requests = urls.map(function (url) {
    return {
      url: url,
      method: "get",
      "headers": { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      contentType: "application/json",
      muteHttpExceptions: true
    } as GoogleAppsScript.URL_Fetch.URLFetchRequest;
  });
  console.log('Fetch All Starting.');
  let responses = UrlFetchApp.fetchAll(requests);
  console.log('Fetch All Complete.');

  const rpa_projects = processResponseByIndex_(responses, urls, 0);
  const employee_user = processResponseByIndex_(responses, urls, 1);
  const office = processResponseByIndex_(responses, urls, 2);
  const milestone = processResponseByIndex_(responses, urls, 3);
  const poa_team = processResponseByIndex_(responses, urls, 4);
  const systems = processResponseByIndex_(responses, urls, 5);
  const enhancements = processResponseByIndex_(responses, urls, 6);
  const ideas = processResponseByIndex_(responses, urls, 7);
  const npes = processResponseByIndex_(responses, urls, 8);
  const documents = processResponseByIndex_(responses, urls, 9);
  const tools = processResponseByIndex_(responses, urls, 10);
  const bugs = processResponseByIndex_(responses, urls, 11);
  const scripts = processResponseByIndex_(responses, urls, 12);
  const ranking = processResponseByIndex_(responses, urls, 13);

  return [rpa_projects, employee_user, office, milestone, poa_team, systems, enhancements, ideas, npes, documents, tools, bugs, scripts, ranking];
}

type WaldoApiGetResponse<T> = { values: T[] };

function processResponse_<T = any>(response: GoogleAppsScript.URL_Fetch.HTTPResponse, url: string): WaldoApiGetResponse<T> {
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 400) {
    console.error('Failed to fetch from ' + url + '. Status code: ' + response.getResponseCode());
    return { values: [] };
  }

  try {
    return JSON.parse(response.getContentText()) as WaldoApiGetResponse<T>;
  }
  catch (error) {
    console.error('Failed to parse from ' + url + '. ' + error);
    return { values: [] };
  }
}

// suffix underscore makes it private, it cannot be called via google.script.run.
function processResponseByIndex_<T = any>(responses: GoogleAppsScript.URL_Fetch.HTTPResponse[], urls: string[], index: number): WaldoApiGetResponse<T> {
  if (index >= responses.length) {
    console.error("Failed to attach an adjacent response.");
    return { values: [] };
  }

  const response = responses[index];
  const url = urls[index];
  return processResponse_<T>(response, url);
}

function getScriptURL() {
  return ScriptApp.getService().getUrl();
}

/** A function to store error logs in the script, so we can lookup errors if it happens on the users end. */
function logError(message: string) {
  console.error(message);
}
