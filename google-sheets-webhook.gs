const SPREADSHEET_ID = '';
const SHEET_NAME = 'Sheet1';
const HEADERS = [
  'timestamp',
  'status',
  'draft_id',
  'name',
  'email',
  'phone',
  'account_transactions',
  'account_age',
  'account_region',
  'qualified',
  'source',
  'last_seen',
  'submitted_at',
];

function doGet() {
  return jsonResponse({ ok: true, service: 'striperia-lead-webhook' });
}

function doPost(event) {
  try {
    const data = parseBody(event);
    const sheet = getSheet();
    ensureHeaders(sheet);

    const status = String(data.status || 'submitted').toLowerCase() === 'draft' ? 'draft' : 'submitted';
    const draftId = String(data.draft_id || data.id || '').trim();
    const now = new Date();
    const rowValues = rowFromLead(data, status, draftId, now);
    const rowIndex = draftId ? findRowByDraftId(sheet, draftId) : -1;

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowValues]);
      return jsonResponse({ ok: true, action: 'updated', status, draft_id: draftId });
    }

    sheet.appendRow(rowValues);
    return jsonResponse({ ok: true, action: 'inserted', status, draft_id: draftId });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) }, 500);
  }
}

function parseBody(event) {
  if (!event || !event.postData || !event.postData.contents) return {};
  return JSON.parse(event.postData.contents);
}

function getSheet() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet. Bind this script to the Sheet or set SPREADSHEET_ID.');
  }

  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeaders(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => existing[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function rowFromLead(data, status, draftId, now) {
  return [
    data.captured_at || now,
    status,
    draftId,
    safeCell(data.name),
    safeCell(data.email),
    safeCell(data.phone),
    safeCell(data.account_transactions),
    safeCell(data.account_age),
    safeCell(data.account_region),
    data.qualified === true || data.qualified === 'true' ? 'TRUE' : 'FALSE',
    safeCell(data.source),
    now,
    status === 'submitted' ? (data.submitted_at || now) : '',
  ];
}

function findRowByDraftId(sheet, draftId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const draftIds = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  for (let index = 0; index < draftIds.length; index += 1) {
    if (String(draftIds[index][0]) === draftId) {
      return index + 2;
    }
  }
  return -1;
}

function safeCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /^[=+\-@]/.test(text.trimStart()) ? "'" + text : text;
}

function jsonResponse(body, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
