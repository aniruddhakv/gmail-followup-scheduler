const MONITORED_SENDERS = [
  'sender1@example.com',
  'sender2@example.com'
];

const FOLLOW_UP_LABEL = 'FollowUp';
const EVENT_DURATION_MINUTES = 30;
const REMINDER_MINUTES = 10;

function processNewEmails() {
  try {
    console.log('Starting email processing...');
    const followUpLabel = getOrCreateLabel(FOLLOW_UP_LABEL);
    MONITORED_SENDERS.forEach(senderEmail => {
      processEmailsFromSender(senderEmail, followUpLabel);
    });
    console.log('Email processing completed successfully');
  } catch (error) {
    console.error('Error in processNewEmails:', error);
  }
}

function processEmailsFromSender(senderEmail, followUpLabel) {
  console.log(`Processing emails from: ${senderEmail}`);
  const searchQuery = `from:${senderEmail} -label:${FOLLOW_UP_LABEL}`;
  const threads = GmailApp.search(searchQuery, 0, 50);
  console.log(`Found ${threads.length} unprocessed threads from ${senderEmail}`);
  threads.forEach(thread => {
    try {
      processEmailThread(thread, followUpLabel);
    } catch (error) {
      console.error(`Error processing thread ${thread.getId()}:`, error);
    }
  });
}

function processEmailThread(thread, followUpLabel) {
  const messages = thread.getMessages();
  const firstMessage = messages[0];
  const sender = firstMessage.getFrom();
  const subject = firstMessage.getSubject();
  const receivedTime = firstMessage.getDate();
  const body = firstMessage.getPlainBody();

  console.log(`Processing email: "${subject}" from ${sender}`);
  thread.addLabel(followUpLabel);
  createFollowUpEvent(sender, subject, receivedTime, body);
  console.log(`Successfully processed and labeled email: "${subject}"`);
}

function createFollowUpEvent(sender, subject, receivedTime, body) {
  const calendar = CalendarApp.getDefaultCalendar();
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + (EVENT_DURATION_MINUTES * 60 * 1000));
  const eventTitle = `Follow-up: ${subject}`;
  const description = createEventDescription(sender, subject, receivedTime, body);

  const event = calendar.createEvent(
    eventTitle,
    startTime,
    endTime,
    {
      description: description,
      location: '',
    }
  );

  event.addPopupReminder(REMINDER_MINUTES);
  console.log(`Created calendar event: "${eventTitle}" at ${startTime}`);
}

function createEventDescription(sender, subject, receivedTime, body) {
  const truncatedBody = body.length > 500 ? body.substring(0, 500) + '...' : body;

  return `FOLLOW-UP REMINDER

📧 From: ${sender}
📋 Subject: ${subject}
📅 Received: ${receivedTime.toLocaleString()}

📝 Email Preview:
${truncatedBody}

---
This event was automatically created by Gmail Follow-up Script`;
}

function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    console.log(`Creating new Gmail label: ${labelName}`);
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

function setupScript() {
  console.log('Setting up Gmail Follow-up Script...');
  try {
    const label = getOrCreateLabel(FOLLOW_UP_LABEL);
    console.log(`✅ Label "${FOLLOW_UP_LABEL}" is ready`);
    const testThreads = GmailApp.search('in:inbox', 0, 1);
    console.log('✅ Gmail access confirmed');
    const calendar = CalendarApp.getDefaultCalendar();
    console.log(`✅ Calendar access confirmed: ${calendar.getName()}`);
    console.log('🎉 Setup completed successfully!');
    console.log('Next steps:');
    console.log('1. Update MONITORED_SENDERS array with your email addresses');
    console.log('2. Set up a time-driven trigger for processNewEmails()');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('Please ensure you have granted necessary permissions');
  }
}

function createTimeDrivenTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processNewEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('processNewEmails')
    .timeBased()
    .everyMinutes(10)
    .create();

  console.log('✅ Time-driven trigger created - script will run every 10 minutes');
}

function testProcessing() {
  console.log('Running test processing...');
  processNewEmails();
}
