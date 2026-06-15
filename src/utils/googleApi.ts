/**
 * Safe, production-grade real Google API integration helpers for Workspace Services.
 * Fully authenticates using OAuth access tokens and lists real-time user resources.
 */

// Helper to construct authorization header
function getAuthHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 1. Google Drive integration methods
 */
export async function fetchGoogleDriveFiles(token: string) {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime)', {
      headers: getAuthHeader(token),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    throw error;
  }
}

export async function createGoogleDriveFolder(token: string, folderName: string) {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw error;
  }
}

/**
 * 2. Google Sheets integration methods
 */
export async function fetchGoogleSpreadsheetData(token: string, spreadsheetId: string, range: string) {
  try {
    const res = await fetch(`https://sheets.googleapis.com/cmd/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: getAuthHeader(token),
    });
    // Fallback to spreadsheets request if standard fails
    const realRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: getAuthHeader(token),
    });
    if (!realRes.ok) throw new Error(await realRes.text());
    const data = await realRes.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}

export async function createGoogleSpreadsheet(token: string, title: string) {
  try {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({
        properties: { title },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('Error creating Google Spreadsheet:', error);
    throw error;
  }
}

/**
 * 3. Google Calendar integration methods
 */
export async function fetchGoogleCalendarEvents(token: string) {
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
      headers: getAuthHeader(token),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

export async function createGoogleCalendarEvent(token: string, event: { summary: string; description?: string; startTime: string; endTime: string }) {
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startTime, timeZone: 'UTC' },
        end: { dateTime: event.endTime, timeZone: 'UTC' },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

/**
 * 4. Gmail integration methods
 */
export async function fetchGmailMessages(token: string) {
  try {
    const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
      headers: getAuthHeader(token),
    });
    if (!listRes.ok) throw new Error(await listRes.text());
    const listData = await listRes.json();
    if (!listData.messages) return [];

    // Fetch details for each message
    const detailedMessages = await Promise.all(
      listData.messages.map(async (msg: { id: string }) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
          headers: getAuthHeader(token),
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const subjectHeader = detail.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const fromHeader = detail.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          return {
            id: msg.id,
            snippet: detail.snippet || '',
            subject: subjectHeader,
            from: fromHeader,
            date: detail.internalDate ? new Date(parseInt(detail.internalDate)).toLocaleString() : '',
          };
        }
        return { id: msg.id, snippet: 'No content', subject: 'Unknown', from: 'Unknown', date: '' };
      })
    );
    return detailedMessages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

/**
 * 5. Google Docs integration methods
 */
export async function fetchGoogleDoc(token: string, documentId: string) {
  try {
    const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      headers: getAuthHeader(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('Error fetching Google Doc:', error);
    throw error;
  }
}

export async function createGoogleDoc(token: string, title: string) {
  try {
    const res = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
}

/**
 * 6. Google Forms integration methods
 */
export async function createGoogleForm(token: string, title: string) {
  try {
    const res = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({
        info: { title },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('Error creating Google Form:', error);
    throw error;
  }
}
