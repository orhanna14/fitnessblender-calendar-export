const beginICalendar = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FitnessBlender//Workouts//EN\nX-WR-CALNAME;CHARSET=utf-8:FitnessBlender Workouts\nMETHOD:PUBLISH\n";
const endICalendar = "END:VCALENDAR";
const maxLengthProperty = 70;
let googleEvents = "";
let dtStamp = dtStampGenerate();

var xhr = new XMLHttpRequest();
xhr.onload = function () {
  googleEvents = xhr.responseText;
  let googleEvents_obj = JSON.parse(googleEvents);

  // Extract the relevant data from the FitnessBlender JSON
  let workouts = extractWorkouts(googleEvents_obj);

  googleEvents = beginICalendar;
  for (let i = 0; i < workouts.length; i++) {
    googleEvents = eventToICalendar(workouts[i], googleEvents);
  }
  googleEvents += endICalendar;

  // Download the .ics file
  download(googleEvents, "fitnessblender_calendar", "ics");
};

xhr.open('GET', 'http://javascript.kiev.ua/attach/icalendar/workouts.json', true);
xhr.send();

// Function to extract workouts from the FitnessBlender JSON
function extractWorkouts(data) {
  let workouts = [];
  const weeks = data.data.calendar.weeks;

  for (let week of weeks) {
    for (let day of week) {
      if (day.scheduledCount > 0) {
        for (let slot in day.slots) {
          if (day.slots[slot] !== null) {
            let workout = day.slots[slot];
            workouts.push({
              title: workout.title,
              date: day.date,
              description: workout.plan ? workout.plan.dayTitle : "",
            });
          }
        }
      }
    }
  }

  return workouts;
}

// Function to convert an event to iCalendar format
function eventToICalendar(event, googleEvents) {
  var newLine = "\n";
  googleEvents += "BEGIN:VEVENT\n";
  googleEvents += "SUMMARY:" + contentLinesRFC(event.title) + "\n";
  googleEvents += "DESCRIPTION:" + contentLinesRFC(event.description) + "\n";
  googleEvents += "DTSTART;VALUE=DATE:" + cleaningDate(event.date) + "\n";
  googleEvents += "DTEND;VALUE=DATE:" + cleaningDate(event.date) + "\n";
  googleEvents += "UID:" + event.date + "-" + event.title.replace(/\s+/g, "-") + "\n";
  googleEvents += "DTSTAMP:" + dtStamp + "\n";
  googleEvents += "END:VEVENT\n";
  return googleEvents;
}

// Function to handle long strings (RFC compliance)
function contentLinesRFC(str) {
  str += "";
  if (str.byteLength() > maxLengthProperty) {
    let result = str.slice(0, str.length / 2) + "\n ";
    result += str.slice(str.length / 2, str.length - 1);
    return result;
  }
  return str;
}

// Function to clean and format dates
function cleaningDate(date) {
  date = date.slice(0, 10);
  date = date.replace(/-/g, "");
  return date;
}

// Function to generate the current timestamp in iCalendar format
function dtStampGenerate() {
  let now = new Date();
  let dateString =
    now.getFullYear() +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    ("0" + now.getDate()).slice(-2) +
    "T" +
    ("0" + now.getHours()).slice(-2) +
    ("0" + now.getMinutes()).slice(-2) +
    ("0" + now.getSeconds()).slice(-2);
  return dateString;
}

// Function to download data to a file
function download(data, filename, type) {
  var a = document.createElement("a"),
    file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob) // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    var url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

// Helper function to calculate byte length of a string
String.prototype.byteLength = function () {
  var byteCounts = [127, 2047, 65535, 2097151, 67108863];
  var str = this,
    length = str.length,
    count = 0,
    i = 0,
    ch = 0;
  for (i; i < length; i++) {
    ch = str.charCodeAt(i);
    if (ch <= byteCounts[0]) {
      count++;
    } else if (ch <= byteCounts[1]) {
      count += 2;
    } else if (ch <= byteCounts[2]) {
      count += 3;
    } else if (ch <= byteCounts[3]) {
      count += 4;
    } else if (ch <= byteCounts[4]) {
      count += 5;
    } else {
      count += 6;
    }
  }
  return count;
};