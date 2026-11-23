// ════════════════════════════════════════════════════════════
//  2Shady Tinting — Apps Script Web App
//  Handles: appointment submissions, analytics tracking, admin data
// ════════════════════════════════════════════════════════════

var SHEET_APPOINTMENTS = 'Appointments';
var SHEET_PAGEVIEWS    = 'PageViews';
var SHEET_LEADS        = 'Leads';

// ── Helpers ─────────────────────────────────────────────────
function getOrCreateSheet(name, headers) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

// ── POST handler ─────────────────────────────────────────────
function doPost(e) {
  try {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch(ex) { data = e.parameter || {}; }

    var type = data.type || 'appointment';

    // ── Page view ──
    if (type === 'pageview') {
      var pvSheet = getOrCreateSheet(SHEET_PAGEVIEWS,
        ['Timestamp','Page','Referrer','Device','Browser','Session']);
      pvSheet.appendRow([
        new Date(), data.page || '/', data.referrer || 'Direct',
        data.device || '', data.browser || '', data.session || ''
      ]);
      return jsonResponse({ success: true });
    }

    // ── Lead event (chat bubble submitted) ──
    if (type === 'lead') {
      var ldSheet = getOrCreateSheet(SHEET_LEADS, ['Timestamp','Service','Session']);
      ldSheet.appendRow([new Date(), data.service || '', data.session || '']);
      return jsonResponse({ success: true });
    }

    // ── Appointment submission (default) ──
    var apptSheet = getOrCreateSheet(SHEET_APPOINTMENTS,
      ['Timestamp','Name','Phone','Email','Service','Vehicle','Date','Notes']);

    if (!data.name || !data.phone || !data.service) {
      return jsonResponse({ success: false, message: 'Please fill in your name, phone number, and select a service.' });
    }

    apptSheet.appendRow([
      new Date(), data.name, data.phone, data.email  || '',
      data.service, data.vehicle || '', data.date || '', data.notes || ''
    ]);

    var subject = 'New Appointment Request — ' + data.service + ' | 2 Shady Tinting';
    var body    =
      'NEW APPOINTMENT REQUEST — 2 Shady Tinting\n' +
      '=============================================\n\n' +
      'Name:     ' + data.name    + '\n' +
      'Phone:    ' + data.phone   + '\n' +
      'Email:    ' + (data.email   || '') + '\n' +
      'Service:  ' + data.service + '\n' +
      'Vehicle:  ' + (data.vehicle || '') + '\n' +
      'Date:     ' + (data.date   || '') + '\n' +
      'Notes:    ' + (data.notes  || '') + '\n\n' +
      '=============================================\n' +
      'Sent from the 2shadytinting.com chat widget\n';

    GmailApp.sendEmail('sales@2shadytinting.com', subject, body);
    GmailApp.sendEmail('soundzlive@yahoo.com',    subject, body);

    return jsonResponse({ success: true, message: "Thanks, " + data.name + "! We'll be in touch shortly to confirm your appointment." });

  } catch(err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ success: false, message: 'Server error: ' + err.toString() });
  }
}

// ── GET handler (admin dashboard data) ───────────────────────
function doGet(e) {
  var params   = e.parameter || {};
  var action   = params.action   || '';
  var callback = params.callback || '';

  if (action === 'analytics') {
    var payload = getAnalyticsData();
    var json    = JSON.stringify(payload);
    // JSONP for admin dashboard
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

function getAnalyticsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Page views ──
  var pvSheet = ss.getSheetByName(SHEET_PAGEVIEWS);
  var pvRows  = pvSheet ? pvSheet.getDataRange().getValues().slice(1) : [];

  var totalViews    = pvRows.length;
  var weekViews     = pvRows.filter(function(r){ return r[0] instanceof Date && r[0] >= weekAgo; }).length;
  var sessions      = {};
  var referrerCount = {};
  var deviceCount   = {};
  var browserCount  = {};
  var pageCount     = {};

  pvRows.forEach(function(r) {
    sessions[r[5]]  = true;
    var ref  = r[2] || 'Direct';
    var dev  = r[3] || 'Unknown';
    var br   = r[4] || 'Unknown';
    var page = r[1] || '/';
    referrerCount[ref] = (referrerCount[ref] || 0) + 1;
    deviceCount[dev]   = (deviceCount[dev]   || 0) + 1;
    browserCount[br]   = (browserCount[br]   || 0) + 1;
    pageCount[page]    = (pageCount[page]    || 0) + 1;
  });

  // ── Appointments ──
  var apptSheet = ss.getSheetByName(SHEET_APPOINTMENTS);
  var apptRows  = apptSheet ? apptSheet.getDataRange().getValues().slice(1) : [];

  // ── Leads ──
  var ldSheet = ss.getSheetByName(SHEET_LEADS);
  var ldRows  = ldSheet ? ldSheet.getDataRange().getValues().slice(1) : [];

  return {
    totalViews:    totalViews,
    totalSessions: Object.keys(sessions).length,
    totalLeads:    apptRows.length,
    weekViews:     weekViews,
    referrers: sortCount(referrerCount),
    devices:   sortCount(deviceCount),
    browsers:  sortCount(browserCount),
    pages:     sortCount(pageCount),
    submissions: apptRows.reverse().slice(0, 20).map(function(r){
      return [formatDate(r[0]), r[1], r[2], r[3], r[4], r[5], r[6], r[7]];
    }),
    visits: pvRows.reverse().slice(0, 30).map(function(r){
      return [formatDate(r[0]), r[1], r[2], r[3], r[4]];
    })
  };
}

function sortCount(obj) {
  return Object.keys(obj)
    .map(function(k){ return { name: k, count: obj[k] }; })
    .sort(function(a,b){ return b.count - a.count; });
}

function formatDate(d) {
  if (!(d instanceof Date)) return String(d);
  return (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear() +
    ' ' + d.getHours() + ':' + ('0'+d.getMinutes()).slice(-2);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Manual test function
function testDoPost() {
  var fakeEvent = {
    postData: { contents: '' },
    parameter: {
      name: 'Drew Test', phone: '(617) 828-0887', email: 'soundzlive@yahoo.com',
      service: 'Window Tinting', vehicle: '2024 Toyota Camry',
      date: 'Dec 1', notes: 'Manual test from editor'
    }
  };
  Logger.log(doPost(fakeEvent).getContent());
}
