import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function POST(request: NextRequest) {
  try {
    const { leadId, meetingTitle, meetingDate, meetingTime, duration = 30 } = await request.json()

    if (!leadId || !meetingTitle || !meetingDate || !meetingTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    const refreshToken = cookieStore.get('google_refresh_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated. Please connect Google Calendar first.' }, { status: 401 })
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    // Get lead details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Create meeting date-time
    const startDateTime = new Date(`${meetingDate}T${meetingTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

    // Create calendar event with Google Meet
    const event = {
      summary: meetingTitle,
      description: `Meeting with ${lead.businessName}\nPhone: ${lead.phone || 'N/A'}\nWebsite: ${lead.website || 'N/A'}\nAddress: ${lead.address}, ${lead.city}, ${lead.state}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York', // You can make this dynamic
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${leadId}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      attendees: lead.phone
        ? [{ email: lead.phone }] // You'd want actual email here
        : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    }

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    })

    // Update lead with meeting info
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'MEETING_SCHEDULED',
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        meetLink: response.data.hangoutLink,
        startTime: response.data.start?.dateTime,
        endTime: response.data.end?.dateTime,
      },
    })
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string }
    console.error('Schedule meeting error:', error)
    
    // Handle token expiration
    if (err.code === 401) {
      return NextResponse.json(
        { error: 'Authentication expired. Please reconnect Google Calendar.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: (error as Error).message || 'Failed to schedule meeting' },
      { status: 500 }
    )
  }
}

// Get upcoming meetings
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    const refreshToken = cookieStore.get('google_refresh_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Get events for the next 7 days
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    return NextResponse.json({
      success: true,
      events: response.data.items || [],
    })
  } catch (error: unknown) {
    console.error('Get meetings error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to get meetings' },
      { status: 500 }
    )
  }
}
