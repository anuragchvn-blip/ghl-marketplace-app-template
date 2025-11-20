# GHL Marketplace App - OAuth Scopes Configuration

## Required Scopes for App Approval

Configure these scopes in your GHL Marketplace app settings:

### Contacts Management
- ✅ `contacts.write` - Create and update contacts in GHL
- ✅ `contacts.readonly` - Read contact information

### Calendars (for meeting scheduling)
- ✅ `calendars.write` - Create calendar events
- ✅ `calendars.readonly` - Read calendar availability

### Opportunities (optional - for sales pipeline)
- ⚠️ `opportunities.write` - Create opportunities/deals
- ⚠️ `opportunities.readonly` - Read opportunities

### Locations (for multi-location accounts)
- ✅ `locations.readonly` - Read location details

## App Configuration in GHL Marketplace

### 1. Distribution Type
Select based on your target users:
- **Location**: App installs per sub-account
- **Company**: App installs at agency level
- **Both**: Supports both installation types

### 2. Redirect URLs
Add these to your app's OAuth settings:
```
https://yourdomain.com/api/auth/callback
http://localhost:3000/api/auth/callback (for development)
```

### 3. Webhook URLs
Configure in app settings:
```
Uninstall Webhook: https://yourdomain.com/api/webhooks/ghl/uninstall
```

### 4. SSO Configuration
If using SSO (for custom pages in iframe):
- Enable SSO in marketplace settings
- Copy SSO Key to your `.env` as `GHL_APP_SSO_KEY`

## Minimal Scopes for Lead Scraping App

For the core functionality (scrape leads → push to GHL → schedule meetings):

**Required:**
- `contacts.write`
- `contacts.readonly`
- `calendars.write`
- `locations.readonly` (if supporting multi-location)

**Optional:**
- `opportunities.write` (if creating deals)
- `opportunities.readonly` (if reading pipeline data)

## Testing Scopes

1. Install your app in a test GHL account
2. Check the consent screen shows only requested scopes
3. Verify API calls work with granted permissions
4. Test with both location and company installations (if applicable)

## Scope Usage in Code

The scopes are automatically validated by GHL when you make API requests:
- OAuth token includes granted scopes
- API returns 403 if scope not granted
- Refresh token maintains same scopes

## Important Notes

⚠️ **Only request scopes you actually use** - GHL reviews this during approval
⚠️ **Scopes cannot be changed after install** - Users must reinstall to get new scopes
⚠️ **Test thoroughly** - Make sure all features work with requested scopes
