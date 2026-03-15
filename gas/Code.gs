// ===================================================
// Sabot Revenue Tracking - Google Apps Script Backend
// ===================================================
// Google Sheets Structure:
// Sheet "Projects"      -> id, name, target_revenue, estimated_cost, start_date, end_date, status, created_at
// Sheet "Transactions"  -> id, project_id, type, amount, date, description, created_at

var PROJECTS_SHEET = "Projects";
var TRANSACTIONS_SHEET = "Transactions";

// -------------------------------------------------------
// doGet: Handle GET requests
// Actions: getProjects, getTransactions, getProjectById, getTransactionsByProject
// -------------------------------------------------------
function doGet(e) {
  try {
    var action = e.parameter.action;
    var result;

    if (action === "getProjects") {
      result = getProjects();
    } else if (action === "getTransactions") {
      result = getTransactions();
    } else if (action === "getProjectById") {
      var id = e.parameter.id;
      result = getProjectById(id);
    } else if (action === "getTransactionsByProject") {
      var projectId = e.parameter.project_id;
      result = getTransactionsByProject(projectId);
    } else {
      result = { error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------
// doPost: Handle POST requests
// Actions: addProject, addTransaction, updateProjectStatus
// -------------------------------------------------------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;

    if (action === "addProject") {
      result = addProject(data.payload);
    } else if (action === "addTransaction") {
      result = addTransaction(data.payload);
    } else if (action === "updateProjectStatus") {
      result = updateProjectStatus(data.payload);
    } else {
      result = { error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------
// Helper: Get sheet by name, initialize headers if new
// -------------------------------------------------------
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === PROJECTS_SHEET) {
      sheet.getRange(1, 1, 1, 8).setValues([[
        "id", "name", "target_revenue", "estimated_cost",
        "start_date", "end_date", "status", "created_at"
      ]]);
    } else if (name === TRANSACTIONS_SHEET) {
      sheet.getRange(1, 1, 1, 7).setValues([[
        "id", "project_id", "type", "amount",
        "date", "description", "created_at"
      ]]);
    }
  }
  return sheet;
}

// -------------------------------------------------------
// Helper: Generate unique ID
// -------------------------------------------------------
function generateId() {
  return new Date().getTime().toString() + Math.floor(Math.random() * 1000).toString();
}

// -------------------------------------------------------
// Helper: Get current datetime as "YYYY-MM-DDTHH:mm:ss"
// -------------------------------------------------------
function nowDatetime() {
  var now = new Date();
  var tz  = Session.getScriptTimeZone();
  return Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH:mm:ss");
}

// -------------------------------------------------------
// Helper: Format a cell value that may be a Date object
// pattern: "yyyy-MM-dd" for date-only, "yyyy-MM-dd'T'HH:mm:ss" for datetime
// -------------------------------------------------------
function formatCellDate(val, includeTime) {
  if (!val && val !== 0) return "";
  if (val instanceof Date) {
    var tz      = Session.getScriptTimeZone();
    var pattern = includeTime
      ? "yyyy-MM-dd'T'HH:mm:ss"
      : "yyyy-MM-dd";
    return Utilities.formatDate(val, tz, pattern);
  }
  return String(val);
}

// -------------------------------------------------------
// GET: All Projects
// -------------------------------------------------------
function getProjects() {
  var sheet = getSheet(PROJECTS_SHEET);
  var data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];

  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var val = row[i];
      if (h === "created_at") {
        obj[h] = formatCellDate(val, true);
      } else if (h === "start_date" || h === "end_date") {
        obj[h] = formatCellDate(val, false);
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });
}

// -------------------------------------------------------
// GET: Project by ID
// -------------------------------------------------------
function getProjectById(id) {
  var projects = getProjects();
  return projects.find(function(p) { return String(p.id) === String(id); }) || null;
}

// -------------------------------------------------------
// GET: All Transactions
// -------------------------------------------------------
function getTransactions() {
  var sheet = getSheet(TRANSACTIONS_SHEET);
  var data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];

  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var val = row[i];
      if (h === "created_at") {
        obj[h] = formatCellDate(val, true);
      } else if (h === "date" || h === "datetime") {
        // keep date-only column as date string (no time)
        obj[h] = formatCellDate(val, false);
      } else {
        obj[h] = val;
      }
    });

    // Back-compat: some old sheets use "datetime" instead of "date"
    if (obj["datetime"] !== undefined && obj["date"] === undefined) {
      obj["date"] = obj["datetime"];
    } else if (obj["date"] !== undefined && obj["datetime"] === undefined) {
      obj["datetime"] = obj["date"];
    }

    return obj;
  });
}

// -------------------------------------------------------
// GET: Transactions by Project ID
// -------------------------------------------------------
function getTransactionsByProject(projectId) {
  var transactions = getTransactions();
  return transactions.filter(function(t) {
    return String(t.project_id) === String(projectId);
  });
}

// -------------------------------------------------------
// POST: Add New Project  (no department, with created_at)
// -------------------------------------------------------
function addProject(payload) {
  var sheet   = getSheet(PROJECTS_SHEET);
  var id      = generateId();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // created_at: prefer value sent from frontend, fall back to server time
  var createdAt = payload.created_at || nowDatetime();

  // Detect header layout for backward compat with old sheets that have "department"
  var hasDept = headers.indexOf("department") !== -1;

  var row;
  if (hasDept) {
    // Old 8-column sheet (with department)
    row = [
      id,
      payload.name               || "",
      payload.department         || "",
      Number(payload.target_revenue)  || 0,
      Number(payload.estimated_cost)  || 0,
      payload.start_date         || "",
      payload.end_date           || "",
      payload.status             || "Active"
    ];
    // Append created_at if the sheet already has that column
    if (headers.indexOf("created_at") !== -1) {
      row.push(createdAt);
    }
  } else {
    // New 8-column sheet (id, name, target_revenue, estimated_cost, start_date, end_date, status, created_at)
    row = [
      id,
      payload.name               || "",
      Number(payload.target_revenue)  || 0,
      Number(payload.estimated_cost)  || 0,
      payload.start_date         || "",
      payload.end_date           || "",
      payload.status             || "Active",
      createdAt
    ];
  }

  sheet.appendRow(row);
  return { result: "success", id: id, created_at: createdAt };
}

// -------------------------------------------------------
// POST: Add New Transaction  (date = user-chosen date, created_at = submit timestamp)
// -------------------------------------------------------
function addTransaction(payload) {
  var sheet   = getSheet(TRANSACTIONS_SHEET);
  var id      = generateId();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // "date" = the real transaction date chosen by the user (YYYY-MM-DD)
  var dateVal = payload.date || payload.datetime || nowDatetime().substring(0, 10);

  // Strip time part if user somehow sent a datetime string as date
  if (dateVal && dateVal.length > 10) {
    dateVal = dateVal.substring(0, 10);
  }

  // "created_at" = exact timestamp when the user clicked submit (sent from frontend)
  var createdAt = payload.created_at || nowDatetime();

  var hasCreatedAt = headers.indexOf("created_at") !== -1;

  var row;
  if (hasCreatedAt) {
    // 7-column layout
    row = [
      id,
      payload.project_id  || "",
      payload.type        || "Income",
      Number(payload.amount) || 0,
      dateVal,
      payload.description || "",
      createdAt
    ];
  } else {
    // Old 6-column layout — still write 6 cols; migration can add column later
    row = [
      id,
      payload.project_id  || "",
      payload.type        || "Income",
      Number(payload.amount) || 0,
      dateVal,
      payload.description || ""
    ];
  }

  sheet.appendRow(row);
  return { result: "success", id: id, created_at: createdAt };
}

// -------------------------------------------------------
// POST: Update Project Status
// -------------------------------------------------------
function updateProjectStatus(payload) {
  var sheet   = getSheet(PROJECTS_SHEET);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol     = headers.indexOf("id");
  var statusCol = headers.indexOf("status");

  if (idCol === -1 || statusCol === -1) {
    return { error: "Required columns not found" };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.id)) {
      sheet.getRange(i + 1, statusCol + 1).setValue(payload.status);
      return { result: "success" };
    }
  }
  return { error: "Project not found" };
}

// -------------------------------------------------------
// Setup: Initialize Sheets with sample data (run once)
// -------------------------------------------------------
function setupSampleData() {
  var projectsSheet = getSheet(PROJECTS_SHEET);
  var transSheet    = getSheet(TRANSACTIONS_SHEET);

  // Sample projects — 8 columns including created_at
  var projects = [
    ["P001", "โครงการตรวจสุขภาพประจำปี",   500000, 150000, "2024-01-01", "2024-12-31", "Active",    "2024-01-01T08:00:00"],
    ["P002", "โครงการผ่าตัดแบบ Daycare",     800000, 300000, "2024-03-01", "2024-12-31", "Active",    "2024-03-01T08:00:00"],
    ["P003", "โครงการคลินิกเฉพาะทางหัวใจ", 1200000, 400000, "2024-01-01", "2024-06-30", "Completed", "2024-01-01T08:00:00"],
  ];

  if (projectsSheet.getLastRow() <= 1) {
    projectsSheet.getRange(2, 1, projects.length, projects[0].length).setValues(projects);
  }

  // Sample transactions — 7 columns including created_at
  var transactions = [
    ["T001", "P001", "Income", 45000,  "2024-01-15", "รายได้ตรวจสุขภาพ เดือนมกราคม",          "2024-01-15T09:05:00"],
    ["T002", "P001", "Cost",   12000,  "2024-01-20", "ค่าวัสดุสิ้นเปลือง",                     "2024-01-20T14:32:00"],
    ["T003", "P002", "Income", 85000,  "2024-03-10", "รายได้ผ่าตัด Daycare เดือนมีนาคม",       "2024-03-10T10:18:00"],
    ["T004", "P002", "Cost",   25000,  "2024-03-15", "ค่าอุปกรณ์ผ่าตัด",                       "2024-03-15T13:47:00"],
    ["T005", "P003", "Income", 120000, "2024-01-31", "รายได้คลินิกหัวใจ เดือนมกราคม",          "2024-01-31T08:02:00"],
    ["T006", "P003", "Income", 130000, "2024-02-28", "รายได้คลินิกหัวใจ เดือนกุมภาพันธ์",      "2024-02-28T09:33:00"],
    ["T007", "P003", "Cost",   40000,  "2024-02-01", "ค่าตอบแทนแพทย์ผู้เชี่ยวชาญ",            "2024-02-01T11:01:00"],
    ["T008", "P001", "Income", 52000,  "2024-02-15", "รายได้ตรวจสุขภาพ เดือนกุมภาพันธ์",       "2024-02-15T15:31:00"],
  ];

  if (transSheet.getLastRow() <= 1) {
    transSheet.getRange(2, 1, transactions.length, transactions[0].length).setValues(transactions);
  }

  return { result: "Sample data setup complete" };
}

// -------------------------------------------------------
// Migration: Add "created_at" column to an existing sheet
// Run ONCE manually from the Apps Script editor.
// Usage: migrateAddCreatedAt("Transactions")
//        migrateAddCreatedAt("Projects")
// -------------------------------------------------------
function migrateAddCreatedAt(sheetName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName || TRANSACTIONS_SHEET);
  if (!sheet) return "Sheet not found: " + sheetName;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("created_at") !== -1) {
    return "created_at column already exists in " + sheetName;
  }

  // Append header
  var newCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, newCol).setValue("created_at");

  // Fill existing rows with empty string (no retroactive timestamp)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var emptyVals = Array(lastRow - 1).fill([""]);
    sheet.getRange(2, newCol, lastRow - 1, 1).setValues(emptyVals);
  }

  return "created_at column added to " + sheetName + " (" + (lastRow - 1) + " existing rows left blank)";
}

// -------------------------------------------------------
// Migration: Remove "department" column from Projects sheet
// Run ONCE manually from the Apps Script editor if needed.
// -------------------------------------------------------
function migrateDepartmentColumn() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PROJECTS_SHEET);
  if (!sheet) return "Projects sheet not found";

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var deptIdx = headers.indexOf("department");

  if (deptIdx === -1) return "No department column found – nothing to do";

  sheet.deleteColumn(deptIdx + 1); // Sheets API is 1-based
  return "department column removed successfully";
}
