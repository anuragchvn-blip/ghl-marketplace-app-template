import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a test user for development
  const testUser = await prisma.user.upsert({
    where: { resourceId: 'test-location-123' },
    create: {
      resourceId: 'test-location-123',
      userType: 'Location',
      locationId: 'test-location-123',
      companyId: 'test-company-123',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      scope: 'contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write',
      dayPassActive: false,
      dayPassLeadsUsed: 0,
      dayPassLeadsLimit: 15,
      totalDayPassesPurchased: 0,
    },
    update: {},
  })

  console.log('✅ Test user created:', testUser)
  console.log('\n📝 To use this test user, add this to your request URL:')
  console.log('   ?locationId=test-location-123')
  console.log('\n   Or set this cookie:')
  console.log('   ghl-auth-token=test-access-token')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
