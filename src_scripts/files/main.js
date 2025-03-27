"use strict";

function include(File) {
  return HtmlService.createHtmlOutputFromFile(File).getContent();
};
// *******************************************************************************************
// GOOGLE FILE IDs
// *******************************************************************************************
const dashboardTitle = "Project Monitor Tracker";
const logSheetID = "";
const databaseID = "";
const databaseSheetName = "";
const dataSheetID = "1XMuMmegsqwWouK53yZ6ul3xaO2l-xQy1XsHC0jImVXg";
const adminSheetName = "poa_team";
const userListSheetName = "employee_user";
const userListSheetID = "13iQ6w2NjgGhlFhZTyG5Szt7Q0lI478a6fGnjtsFUaOU";
const dataExportFolderID = "1HB7oLbAxbGVK0W_Zhs_GVJpEsbVu-L4p";
const configSheetID = "1qfz-6G-zbjUKHlytnj7c-7cVm8ifwM52";
const ccEmails = "rpaoffice@gsa.gov";
const logFileFolderID = "1jUO5hIlmuJ2LBy7xLzZ0xiXi8GJrQaDV";
// *******************************************************************************************
// FEATURES
// *******************************************************************************************
const userRoles = true;
const adminRoles = true;
// *******************************************************************************************
// CONSTANTS
// *******************************************************************************************
const todayDate = Utilities.formatDate(new Date(), "America/New_York", "MM-dd-yyyy");
const todayDateTime = Utilities.formatDate(new Date(), "America/New_York", "MM-dd-yyyy HH:mm:ss");

function doGet(e) {
  const user = Session.getActiveUser().getEmail().toLocaleLowerCase();
  console.log(user);
  if (adminRoles) {
    const isAdmin = isActiveUserAdmin();
    // if have admin role & user roles
    if (userRoles) {
      const access = getUserAccess();
      // EXAMPLE PROVIDED. MODIFY AS NEEDED
      if (access.ID == "" && !isAdmin) {
        return HtmlService.createHtmlOutput("<b>Access Denied</b>");
      }
    }
    // if only have admin role
    else {
      if (!isAdmin) {
        return HtmlService.createHtmlOutput("<b>Access Denied</b>");
      }
    }
  }
  let html = HtmlService.createTemplateFromFile('index');
  html.params = e.queryString;
  try {
    return html
      .evaluate()
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setTitle(dashboardTitle)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setFaviconUrl('https://www.gsa.gov/sites/gsa.gov/themes/custom/gsa/logo.png');
  } catch (e) {
    Logger.log(e.message);
    Logger.log("invalid or no parameters passed");
    return ContentService.createTextOutput(e.message);
  };
}

function getData(type, param) {
  // type = "inputData"
  // var LogFile = DriveApp.getFolderById(logFileFolderID).createFile(dashboardTitle + " getData: " + Session.getActiveUser().getEmail().replace("@gsa.gov", "") + "_" + Utilities.formatDate(new Date(), "America/New_York", "MM/dd/yyyy HH:mm:ss") + ".txt", "Logger...");
  // Logger.log = (text) => {
  //   let lag = LogFile.getBlob().getDataAsString();
  //   LogFile.setContent(lag + "\n" + text);
  // };
  Logger.log("inside getData");
  Logger.log(type);
  // if there are user roles
  let isAdmin = false;
  let access = {};
  if (adminRoles) {
    isAdmin = isActiveUserAdmin();
    Logger.log("Admin: " + isAdmin);
    // if have admin role & user roles
    if (userRoles) {
      access = getUserAccess();
      Logger.log(JSON.stringify(access));
    }
  }
  switch (type) {
    case "ideas":
      var ideaData = getJsonArrayFromData(readRange("1RsCBmANXBJYp_8rZt-owp5g2UFmi3PCmC0fg5tN3BtM", "ideas")[0].values);
      var officeData = getJsonArrayFromData(readRange("1SLSJY-T0w72i9SnWn3KlXp7KlxsnRMeUlEAOo4Xi0Lc", "office")[0].values);
      // ideaData = ideaData.filter(row => typeof row.submitter === 'string' && row.submitter !== "");
      // get office
      ideaData.forEach(row => {
        // // convert dates to date object
        // Object.keys(row).forEach(colName => {
        //   if (colName.includes("date")) {
        //     row[colName] = row[colName] ? new Date(row[colName]) : '';
        //   }
        // });
        // get office
        row.sso = findValue(row.office_id, officeData, "ID", "sso");
        row.dept_code = findValue(row.office_id, officeData, "ID", "dept_code");
        row.category = JSON.stringify(row.category?.replaceAll(", ", ",").split(","));
        row.benefits = JSON.stringify(row.benefits?.split(","));
      });
      // USER ROLES
      if (adminRoles || userRoles) {
        // EXAMPLE PROVIDED. MODIFY FUNCTION TO FILTER DATA ACCORDING TO USER ACCESS
        if (isAdmin) { // admin - show all data
          Logger.log("Admin Role");
          Logger.log(JSON.stringify(ideaData));
          return ideaData;
        }
        if (access.role == "admin") { // admin - show all data
          Logger.log("Admin Role");
          Logger.log(JSON.stringify(ideaData));
          return ideaData;
        } else if (access.role == "supervisor") { // supervisor - show all office data
          Logger.log("Supervisor Role");
          // get office ID
          let officeIDs = officeData.filter(row => row.sso == access.office).map(row => row.ID);
          let filteredInputData = ideaData.filter(row => officeIDs.includes(row.office_id));
          Logger.log(JSON.stringify(filteredInputData));
          return filteredInputData;
        } else if (access.role == "") { // normal user - show their own data
          Logger.log("Normal Role");
          let filteredInputData = ideaData.filter(row => row.submitter == access.email);
          Logger.log(JSON.stringify(filteredInputData));
          return filteredInputData;
        }
      }
      Logger.log(JSON.stringify(ideaData));
      return ideaData;
    case "support_tickets":
      var ideaData = getJsonArrayFromData(readRange("1RsCBmANXBJYp_8rZt-owp5g2UFmi3PCmC0fg5tN3BtM", "ideas")[0].values);
      let ticketsData = getJsonArrayFromData(readRange("1YrA_xr3wkPWWcpVJN3d4OAL6dQ4s-GlQfFZpPhSzt14", "support_tickets")[0].values);
      var rpaData = getJsonArrayFromData(readRange("1zfnKYDgWZZEeVk97dCjPpDRMfrl-r9JKS-ZlTTmQx2g", "rpa_projects")[0].values);
      var scrData = getJsonArrayFromData(readRange("15LzhrQLiNYNQx8QOeXtu9b6TkOWCrA_hCXbAKUQfZ8U", "script_projects")[0].values);
      var officeData = getJsonArrayFromData(readRange("1SLSJY-T0w72i9SnWn3KlXp7KlxsnRMeUlEAOo4Xi0Lc", "office")[0].values);
      let data = [...rpaData, ...scrData];
      // get folder id, get office
      ticketsData.forEach(row => {
        var foundRow = data.filter(row2 => row2.ID == row.project_id);
        if (foundRow.length > 0) {
          foundRow = foundRow[0];
          row.project_folder_id = foundRow.project_folder_id;
          row.office_id = foundRow.office_id;
          // get office
          row.sso = findValue(row.office_id, officeData, "ID", "sso");
          row.dept_code = findValue(row.office_id, officeData, "ID", "dept_code");
          // get eoa flag
          row.eoa_flag = findValue(row.subidea_id, ideaData, "ID", "eoa_flag");
          // get process owner, custodians
          row.custodian_ids = foundRow.custodian_ids;
          row.process_owner_ids = foundRow.process_owner_ids;
        }
      });
      // USER ROLES
      if (adminRoles || userRoles) {
        // EXAMPLE PROVIDED. MODIFY FUNCTION TO FILTER DATA ACCORDING TO USER ACCESS
        if (isAdmin) { // admin - show all data
          Logger.log("Admin Role");
          Logger.log(JSON.stringify(ticketsData));
          return ticketsData;
        }
        if (access.role == "admin") { // admin - show all data
          Logger.log("Admin Role");
          Logger.log(JSON.stringify(ticketsData));
          return ticketsData;
        } else if (access.role == "supervisor") { // supervisor - show all office data
          Logger.log("Supervisor Role");
          // get office ID
          let officeIDs = officeData.filter(row => row.sso == access.office).map(row => row.ID);
          let filteredInputData = ticketsData.filter(row => officeIDs.includes(row.office_id));
          Logger.log(JSON.stringify(filteredInputData));
          return filteredInputData;
        } else if (access.role == "") { // normal user - show their own data
          Logger.log("Normal Role");
          let filteredInputData = ticketsData.filter(row => row.custodian_ids?.includes(access.ID) || row.process_owner_ids?.includes(access.ID) || row.submitter == access.email);
          Logger.log(JSON.stringify(filteredInputData));
          return filteredInputData;
        }
      }
      Logger.log(JSON.stringify(ticketsData));
      return ticketsData;
    case "inputData":
      var ideaData = getJsonArrayFromData(readRange("1RsCBmANXBJYp_8rZt-owp5g2UFmi3PCmC0fg5tN3BtM", "ideas")[0].values);
      var rpaData = getJsonArrayFromData(readRange("1zfnKYDgWZZEeVk97dCjPpDRMfrl-r9JKS-ZlTTmQx2g", "rpa_projects")[0].values);
      var scrData = getJsonArrayFromData(readRange("15LzhrQLiNYNQx8QOeXtu9b6TkOWCrA_hCXbAKUQfZ8U", "script_projects")[0].values);
      let bugData = getJsonArrayFromData(readRange("12CVXC8YjCgUGMptSsO5JFl0VtHqPk6F-BI9JIsiv7nw", "bugs")[0].values);
      let enhData = getJsonArrayFromData(readRange("1l9gT8WLnRy6QAV8QcVFbPmzTaBJqc4J10jEdaOFt1KI", "enhancements")[0].values);
      let ticketData = getJsonArrayFromData(readRange("1YrA_xr3wkPWWcpVJN3d4OAL6dQ4s-GlQfFZpPhSzt14", "support_tickets")[0].values);
      var officeData = getJsonArrayFromData(readRange("1SLSJY-T0w72i9SnWn3KlXp7KlxsnRMeUlEAOo4Xi0Lc", "office")[0].values);
      let milestoneData = getJsonArrayFromData(readRange("10YemqE6mD_pJ8OTRpfk8Tija-5QI5EQf1fONwm4hgks", "project_milestones")[0].values);
      let poaData = getJsonArrayFromData(readRange("1XMuMmegsqwWouK53yZ6ul3xaO2l-xQy1XsHC0jImVXg", "poa_team")[0].values);
      let employeeData = getJsonArrayFromData(readRange("13iQ6w2NjgGhlFhZTyG5Szt7Q0lI478a6fGnjtsFUaOU", "employee_user")[0].values);
      let systemData = getJsonArrayFromData(readRange("1zs3bqliSte71aQtnKrCEMn2wrAB66BZG-q5__qGTiis", "systems")[0].values);
      let toolData = getJsonArrayFromData(readRange("1RZrLCDQWzTcaBWk4mK47PbJTXjjyWAWawCUrXqhG1pk", "it_tools")[0].values);
      let rankingData = getJsonArrayFromData(readRange("1XD_E28ux-ijKrkv03MXKPxYdrX60iWqQbwoFuIvAjyA", "rankings")[0].values);
      const rpaMilestones = ["kickoff_complete", "archer", "dd_complete", "pta_complete", "system_access_signatures", "attributes_questionnaire", "developer_testing_complete", "demo_video", "security_assessment", "uat_complete"];
      const scrMilestones = ["kickoff_complete", "dd_complete", "developer_testing_complete", "uat_complete"];
      let inputData = [...rpaData, ...scrData, ...bugData, ...enhData];
      inputData.forEach(row => {
        // get eoa flag
        row.eoa_flag = findValue(row.subidea_id, ideaData, "ID", "eoa_flag");
        // get backlog rank
        row.rank = findValue(row.ID, rankingData, "project_id", "rank");
        // get process owner
        row.process_owner_ids = JSON.stringify(row.process_owner_ids.split(",").map(val => findValue(val?.trim(), employeeData, "ID", "name")));
        // get developer
        row.dev_id = JSON.stringify(row.dev_id.split(",").map(val => findValue(val?.trim(), poaData, "ID", "name")));
        // get office
        row.sso = findValue(row.office_id, officeData, "ID", "sso");
        row.dept_code = findValue(row.office_id, officeData, "ID", "dept_code");
        // get tools
        if (row.tools_ids) {
          row.tools_ids = JSON.stringify(row.tools_ids?.split(",").map(val => findValue(val?.trim(), toolData, "ID", "name")));
        } else {
          row.tools_ids = "";
        }
        // get systems
        if (row.system_ids) {
          row.system_ids = JSON.stringify(row.system_ids?.split(",").map(val => findValue(val?.trim(), systemData, "ID", "name")));
        } else {
          row.system_ids = "";
        }
        // get project type, submitter
        if (row.ID.includes("RPA")) {
          row.projectType = "RPA";
        } else if (row.ID.includes("SCR")) {
          row.projectType = "SCR";
        } else if (row.ID.includes("BUG")) {
          row.projectType = "BUG";
          row.submitted_by = findValue(row.ticket_id, ticketData, "ID", "submitter");
        } else if (row.ID.includes("ENH")) {
          row.projectType = "ENH";
          row.submitted_by = findValue(row.ticket_id, ticketData, "ID", "submitter");
        }
        // get milestones
        row.milestoneInfo = findRow(row.ID, milestoneData, "ref_id");
        row.devProgress = 0;
        row.milestones = 0;
        if (row.milestoneInfo != []) {
          // milestone dev pct
          row.devProgress = row.milestoneInfo.development_pct || 0;
          // milestone pct for RPA
          if (row.projectType == "RPA" || (row.projectType == "ENH" && row.project_id.includes("RPA"))) {
            row.milestoneInfo = extractValues(row.milestoneInfo, rpaMilestones);
            row.milestones = countNonEmptyValues(row.milestoneInfo) * 10;
          }
          // milestone pct for SCR
          else if (row.projectType == "SCR" || (row.projectType == "ENH" && row.project_id.includes("SCR"))) {
            row.milestoneInfo = extractValues(row.milestoneInfo, scrMilestones);
            row.milestones = countNonEmptyValues(row.milestoneInfo) * 5;
          }
        }
        row.description = row.description?.replaceAll("[", "(");
        row.description = row.description?.replaceAll("]", ")");
      });
      // OPTIONAL: PERFORM DATA MANIPULATIONS HERE
      if (adminRoles || userRoles) {
        // EXAMPLE PROVIDED. MODIFY FUNCTION TO FILTER DATA ACCORDING TO USER ACCESS
        if (isAdmin) { // admin - show all data
          Logger.log("Admin Role");
          Logger.log(JSON.stringify(inputData));
          return inputData;
        }
        if (access.role == "admin") { // admin - show all data
          Logger.log("Admin Role");
          Logger.log(JSON.stringify(inputData));
          return inputData;
        } else if (access.role == "supervisor") { // supervisor - show all office data
          Logger.log("Supervisor Role");
          // get office ID
          let officeIDs = officeData.filter(row => row.sso == access.office).map(row => row.ID);
          let filteredInputData = inputData.filter(row => officeIDs.includes(row.office_id));
          Logger.log(JSON.stringify(filteredInputData));
          return filteredInputData;
        } else if (access.role == "") { // normal user - show their own data
          Logger.log("Normal Role");
          let filteredInputData = inputData.filter(row => row.custodian_ids?.includes(access.ID) || row.process_owner_ids?.includes(access.ID));
          Logger.log(JSON.stringify(filteredInputData));
          return filteredInputData;
        }
      }
      Logger.log(JSON.stringify(inputData));
      return inputData;
    case "dbConfig":
      let dbConfig = JSON.parse(DriveApp.getFileById(configSheetID).getBlob().getDataAsString());
      Logger.log(JSON.stringify(dbConfig));
      return dbConfig;
    case "highlights":
      var highlights = getJsonArrayFromData(readRange("1K7ytz5qZeobTLVmcGiMiGoV4b9bcMkRDHsqH2kp78Ps", "Highlights")[0].values);
      return highlights;
    case "logs":
      if (logSheetID) {
        const logs = getJsonArrayFromData(readRange(logSheetID, "Logs")[0].values);
        // sort descending
        logs.sort(function(a, b) {
          return new Date(b.Date) - new Date(a.Date);
        });
        Logger.log(JSON.stringify(logs));
        return logs;
      } else {
        return {};
      }
    case "userAccess":
      access["isAdmin"] = isAdmin;
      Logger.log(access);
      return access;
  }
}

function isActiveUserAdmin() {
  const scriptCache = CacheService.getScriptCache();
  const key = "isAdmin";
  let admins;
  let cachedAdmins = scriptCache.get('admins');
  if (cachedAdmins == null) {
    admins = updateAdminCache();
  } else {
    admins = cachedAdmins.split(',');
  }
  let userEmail = getActiveUserEmail()?.toLocaleLowerCase();
  const isAdmin = admins.includes(userEmail);
  // update userCache
  CacheService.getUserCache().put(key, isAdmin.toString().toLocaleLowerCase(), 60 * 60 * 24);
  return isAdmin;
}
// RUN THIS FUNCTION TO UPDATE ADMIN CACHE
function updateAdminCache() {
  const scriptCache = CacheService.getScriptCache();
  let adminList = getJsonArrayFromData(SpreadsheetApp.openById(dataSheetID).getSheetByName(adminSheetName).getDataRange().getDisplayValues());
  const list = adminList.filter(row => row.status == "Active").map(row => row.email);
  scriptCache.put('admins', list.join(','), 60 * 60 * 24);
  return list;
}

function getActiveUserEmail() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (err) {
    console.error("Error fetching the user email: " + err.message);
  }
  return '';
}

function getUserAccess() {
  try {
    const cachedJSON = {
      "ID": "",
      "name": "",
      "email": "",
      "status": "",
      "office": "",
      "ent": "",
      "role": ""
    };
    const expirationTime = 60 * 60 * 24;
    const userCache = CacheService.getUserCache();
    const key = "props";
    const email = Session.getActiveUser().getEmail();
    Logger.log(email);
    const cached = userCache.get(key);
    // // if found cache
    // if (cached != null) {
    //   return JSON.parse(cached);
    // }
    // if not cached, query data
    var result = formatQueryResult(queryData("select * where C ='" + email + "'", userListSheetID, userListSheetName));
    // if user has access
    if (result.length > 0) {
      var obj = result[0];
      Logger.log(JSON.stringify(obj));
      userCache.put(key, JSON.stringify(obj), expirationTime);
      return result[0];
    }
    // if user does not have access
    else {
      userCache.put(key, JSON.stringify(cachedJSON), expirationTime);
      return cachedJSON;
    }
  } catch (err) {
    Logger.log("Error fetching user access: " + err.message);
    return cachedJSON;
  }
}

function exportData(rawData, userEmail, tableName) {
  // Create a log file for debugging.
  const LogFile = DriveApp.getFolderById(logFileFolderID).createFile("Export Data " + userEmail + "_" + todayDate + ".txt", "Logger...");
  Logger.log = text => {
    const lag = LogFile.getBlob().getDataAsString();
    LogFile.setContent(lag + "\n" + text);
  };
  Logger.log(JSON.stringify(rawData));
  Logger.log(userEmail);
  Logger.log(tableName);
  // Load the dashboard configuration from dbConfig.json.
  const dbConfig = JSON.parse(DriveApp.getFileById(configSheetID).getBlob().getDataAsString());
  // build the base config order from dbConfig (all columns in desired order).
  const configOrder = dbConfig.metadata[tableName].map(col => col.name);
  // If rawData is an array of objects, convert it to a 2D array in the correct order,
  if (isNonEmptyArray(rawData) && isArrayOfObjects(rawData)) {
    const finalHeaderOrder = getFinalHeaderOrderForObjects(rawData, configOrder);
    rawData = convertObjectsToArray(rawData, finalHeaderOrder);
  }
  try {
    // Logger.log(rawData);
    const lock = lockScript();
    if (!lock) {
      throw new Error("Cannot obtain script lock to export data");
    }
    let dataArr = [];
    // If rawData is a 2D array with a header row, remove columns not in configOrder
    if (isNonEmptyArray(rawData) && Array.isArray(rawData[0])) {
      dataArr = filter2DArrayColumns(rawData, configOrder);
    }
    // If rawData is still an array of objects or unexpected format.
    else if (isNonEmptyArray(rawData) && typeof rawData[0] === "object") {
      // if rawData is still an array of objects
      const fallbackHeaderOrder = Object.keys(rawData[0]);
      dataArr.push(fallbackHeaderOrder);
      rawData.forEach(row => {
        const newRow = fallbackHeaderOrder.map(key => row[key] ?? "");
        dataArr.push(newRow);
      });
    } else {
      throw new Error("rawData is empty, not an array, or unrecognized format.");
    }
    // Clean up cell values
    dataArr = dataArr.map(row => row.map(cleanCellValue));
    // Create a new Google Sheet in the given folder.
    const name = dashboardTitle + " Export " + todayDate;
    const folderId = dataExportFolderID;
    const resource = {
      title: name,
      mimeType: MimeType.GOOGLE_SHEETS,
      parents: [{
        id: folderId
      }]
    };
    const fileJson = Drive.Files.insert(resource, null, {
      supportsAllDrives: true
    });
    const fileId = fileJson.id;
    Logger.log("Created file: " + fileId);
    // Write the data to the sheet
    const ss = SpreadsheetApp.openById(fileId);
    const sheet = ss.getSheetByName("Sheet1").setName(tableName);
    sheet.getRange(1, 1, dataArr.length, dataArr[0].length).setValues(dataArr).setFontFamily("Montserrat");
    // Format the sheet (freeze header, bold text, set background, auto-resize, delete empty rows and columns).
    sheet.setFrozenRows(1);
    const headerRange = sheet.getRange(1, 1, 1, dataArr[0].length);
    headerRange.setFontWeight("bold").setBackground("#f2f2f2");
    for (let i = 1; i <= dataArr[0].length; i++) {
      sheet.autoResizeColumn(i);
    }
    const maxRows = sheet.getMaxRows();
    const lastRow = sheet.getLastRow();
    sheet.deleteRows(lastRow + 1, maxRows - lastRow);
    const maxCols = sheet.getMaxColumns();
    const lastCol = sheet.getLastColumn();
    sheet.deleteColumns(lastCol + 1, maxCols - lastCol);
    SpreadsheetApp.flush();
    // Share the file with the user
    DriveApp.getFileById(fileId).addEditor(userEmail);
    lock.releaseLock();
    return {
      msg: {
        id: fileId
      }
    };
  } catch (e) {
    Logger.log(e.message);
    // Send an email in case of error
    GmailApp.sendEmail(ccEmails, dashboardTitle + " ExportData Error", "Error: " + e.message + " Logs: " + LogFile.getName());
    return;
  }
}

function submitFeedback(feedbackData) {
  //   type: feedbackType,
  //   comment: comment.trim(),
  //   userEmail: userEmail,
  //   date: new Date().toISOString(),
  //   userAgent: navigator.userAgent,
  //   path: window.location.pathname
}
// *******************************************************************************************
// HELPER FUNCTIONS
// *******************************************************************************************
function id2Val(id, tbl, colName) {
  let foundRow = tbl.filter(row => row[colName] == id);
  if (foundRow.length > 0) {}
}

function readRange(spreadsheetId, rangeArr) {
  var response = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, {
    ranges: rangeArr
  });
  // Logger.log(response.valueRanges);
  return response.valueRanges;
}
/**
 * Checks if value is a non-empty array.
 */
function isNonEmptyArray(val) {
  return Array.isArray(val) && val.length > 0;
}
/**
 * Checks if the array's first element is an object (i.e., an "array of objects").
 */
function isArrayOfObjects(arr) {
  return typeof arr[0] === "object" && !Array.isArray(arr[0]);
}
/**
 * Given rawData (array of objects) and configOrder,
 * returns a filtered list of column keys that exist in rawData.
 */
function getFinalHeaderOrderForObjects(rawData, configOrder) {
  const actualKeys = Object.keys(rawData[0]);
  return configOrder.filter(colName => actualKeys.includes(colName));
}
/**
 * Converts array of objects into a 2D array, using finalHeaderOrder as columns.
 */
function convertObjectsToArray(rawData, finalHeaderOrder) {
  const result = [];
  result.push(finalHeaderOrder);
  rawData.forEach(item => {
    const row = finalHeaderOrder.map(key => {
      let val = item[key] ?? "";
      return Array.isArray(val) ? val.join(", ") : val;
    });
    result.push(row);
  });
  return result;
}
/**
 * Filters columns in a 2D array so only the ones in configOrder remain,
 * in the same order as configOrder. The first row is assumed to be headers.
 */
function filter2DArrayColumns(twoDArray, configOrder) {
  const dataArr = [];
  const actualHeaders = twoDArray[0];
  // Determine the column indexes we need to keep, in configOrder order.
  const keepIndexes = configOrder.reduce((indexes, colName) => {
    const idx = actualHeaders.indexOf(colName);
    if (idx >= 0) {
      indexes.push(idx);
    }
    return indexes;
  }, []);
  // Build a new header row.
  const newHeaderRow = keepIndexes.map(i => actualHeaders[i]);
  dataArr.push(newHeaderRow);
  // For each row after the header, keep only the columns in keepIndexes.
  for (let i = 1; i < twoDArray.length; i++) {
    const row = twoDArray[i];
    const newRow = keepIndexes.map(index => row[index]);
    dataArr.push(newRow);
  }
  return dataArr;
}
/**
 * Cleans up a single cell value:
 * - If it's an array, join it
 * - If it's a bracketed string, parse & join
 * - Otherwise, return as-is.
 */
function cleanCellValue(cell) {
  if (Array.isArray(cell)) {
    return cell.join(", ");
  }
  if (typeof cell === "string") {
    const trimmed = cell.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.join(", ");
        }
      } catch (e) {
        // If parsing fails, fallback to original string
      }
    }
  }
  return cell;
}

function writeRow(sheetID, sheetName, arr, range) {
  if (range) {
    SpreadsheetApp.openById(sheetID).getSheetByName(sheetName).getRange(range).setValues(arr);
  } else {
    SpreadsheetApp.openById(sheetID).getSheetByName(sheetName).appendRow(arr);
  }
  SpreadsheetApp.flush();
}

function queryData(queryString, spreadsheetID, sheetName, queryColumnLetterStart, queryColumnLetterEnd) {
  if (queryColumnLetterStart) {
    var qvizURL = 'https://docs.google.com/spreadsheets/d/' + spreadsheetID + '/gviz/tq?tqx=out:json&headers=1&sheet=' + sheetName + '&range=' + queryColumnLetterStart + ":" + queryColumnLetterEnd + '&tq=' + encodeURIComponent(queryString);
  } else {
    var qvizURL = 'https://docs.google.com/spreadsheets/d/' + spreadsheetID + '/gviz/tq?tqx=out:json&headers=1&sheet=' + sheetName + '&tq=' + encodeURIComponent(queryString);
  }
  // fetch the data
  var ret = UrlFetchApp.fetch(qvizURL, {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    }
  }).getContentText();
  // remove some crap from the return string
  return JSON.parse(ret.replace("/*O_o*/", "").replace("google.visualization.Query.setResponse(", "").slice(0, -2));
}

function formatQueryResult(data) {
  let myTableArray = [];
  let filteredHeaders = [];
  for (let c = 0; c < data.table.cols.length; c++) {
    filteredHeaders.push(data.table.cols[c].label);
  }
  myTableArray.push(filteredHeaders);
  for (let r = 0; r < data.table.rows.length; r++) {
    var row = [];
    let tmpRow = data.table.rows[r];
    for (let c = 0; c < tmpRow["c"].length; c++) {
      if (tmpRow["c"][c] == null || tmpRow["c"][c]["v"] == null) {
        row.push("");
        continue;
      }
      if (c == myTableArray[0].indexOf("Date") || c == myTableArray[0].indexOf("Database ID")) {
        row.push(tmpRow["c"][c]["f"]);
      } else {
        row.push(tmpRow["c"][c]["v"]);
      }
    }
    myTableArray.push(row);
  }
  let colHeaders = myTableArray[0];
  myTableArray = getJsonArrayFromDataQuery(myTableArray, colHeaders);
  return myTableArray;
}

function getJsonArrayFromDataQuery(data, headers) {
  var obj = {};
  var result = [];
  var cols = headers.length;
  var row = [];
  for (var i = 1; i < data.length; i++) {
    // get a row to fill the object
    row = data[i];
    // clear object
    obj = {};
    for (var col = 0; col < cols; col++) {
      // fill object with new values
      obj[headers[col]] = row[col];
    }
    // add object in a final result
    result.push(obj);
  }
  return result;
}

function getJsonArrayFromData(data) {
  var obj = {};
  var result = [];
  var headers = data[0];
  var cols = headers.length;
  var row = [];
  for (var i = 1, l = data.length; i < l; i++) {
    // get a row to fill the object
    row = data[i];
    // clear object
    obj = {};
    for (var col = 0; col < cols; col++) {
      // fill object with new values
      obj[headers[col]] = row[col];
    }
    // add object in a final result
    result.push(obj);
  }
  return result;
}

function lockScript() {
  var lock = LockService.getScriptLock();
  var success = lock.tryLock(1800000);
  if (!success) {
    Logger.log('Could not obtain lock after 30 seconds.');
    return;
  }
  return lock;
}

function findValue(val, table, identifierName, colNameReturn) {
  let foundRow = table.filter(entry => entry[identifierName] == val);
  if (foundRow.length > 0) {
    return foundRow[0][colNameReturn];
  } else {
    return "";
  }
}

function findRow(val, table, identifierName) {
  let foundRow = table.filter(entry => entry[identifierName] == val);
  if (foundRow.length > 0) {
    return foundRow[0];
  } else {
    return [];
  }
}

function countNonEmptyValues(jsonObject) {
  let count = 0;
  for (const key in jsonObject) {
    if (jsonObject.hasOwnProperty(key)) {
      const value = jsonObject[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              count++;
            }
          } else if (Object.keys(value).length > 0) {
            count++;
          }
        } else {
          count++;
        }
      }
    }
  }
  return count;
}

function extractValues(jsonObject, keysToExtract) {
  const newObject = {};
  for (const key of keysToExtract) {
    if (jsonObject.hasOwnProperty(key)) {
      newObject[key] = jsonObject[key];
    }
  }
  return newObject;
}