// source: http://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
// Usage
//  1. Run > setup
//
//  2. Publish > Deploy as web app 
//    - enter Project Version name and click 'Save New Version' 
//    - set security level and enable service (most likely execute as 'me' and access 'anyone, even anonymously) 
//
//  3. Copy the 'Current web app URL' and post this in your nodejs app.js
//
//  4. Insert column names on your destination sheet matching the parameter names of the data you are passing in (exactly matching case)
//
//  5. fiddle more with this script

var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

function testGet(){
  e = {parameter:{}};
  e.parameter.action = "POST";
  e.parameter.name = "foo";
  e.parameter.comment = "somecomment";
  Logger.log("running testGet");
  doGet(e);
}

function doGet(e){
  switch( e.parameter.action ){
    case "POST":   addrow("Sheet1",1,e.parameter); break;
    default:       addrow("Incoming",1,e.parameter); break;;
  }           
  return ContentService
        .createTextOutput(JSON.stringify({"result":"success","data":e}))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  // dont use this. doPost cannot give an answer (weird! : http://stackoverflow.com/questions/20028646/http-post-and-google-apps-script-file-upload )
}

function addrow(sheetname,columnrow,cells) {
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.
  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(sheetname);        
    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = columnrow || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = []; 

    // loop through the header columns
    for (i in headers){
      if (headers[i] == "timestamp"){ // special case if you include a 'Timestamp' column
        row.push(new Date());
      } else { // else use header name to get data
        row.push(cells[headers[i]]);
      }
    }
    // more efficient to set values as [][] array than individually
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    // return json success results
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
          .setMimeType(ContentService.MimeType.JSON);
  } catch(e){
    // if error return this
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e}))
          .setMimeType(ContentService.MimeType.JSON);
  } finally { //release lock
    lock.releaseLock();
  }
}

function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}
