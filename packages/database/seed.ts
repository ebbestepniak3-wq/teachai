// packages/database/seed.ts – Phase 3 seed
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminHash = await hash('Admin1234!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@teachai.de' },
    update: {},
    create: {
      email: 'admin@teachai.de',
      name: 'Admin Mustermann',
      passwordHash: adminHash,
      role: 'ADMIN',
      emailVerified: true,
      bundesland: 'Bayern',
      schulform: 'Gymnasium',
      isActive: true,
      notifySecurityAlerts: true,
      subscription: { create: { plan: 'MAX_PRO', status: 'ACTIVE' } },
    },
  })
  console.log('✅ Admin:', admin.email)

  // Demo teacher
  const teacherHash = await hash('Teacher1234!', 12)
  const teacher = await prisma.user.upsert({
    where: { email: 'lehrer@teachai.de' },
    update: {},
    create: {
      email: 'lehrer@teachai.de',
      name: 'Maria Schmidt',
      passwordHash: teacherHash,
      role: 'TEACHER',
      emailVerified: true,
      bundesland: 'Nordrhein-Westfalen',
      schulform: 'Gymnasium',
      schule: 'Goethe-Gymnasium Düsseldorf',
      faecher: ['Mathematik', 'Physik'],
      klassen: ['10a', '11b', '12c'],
      isActive: true,
      notifyGradingDone: true,
      notifyQuotaWarning: true,
      notifySecurityAlerts: true,
      subscription: { create: { plan: 'PRO', status: 'ACTIVE' } },
    },
  })
  console.log('✅ Teacher:', teacher.email)

  // Demo notifications for teacher
  await prisma.notification.createMany({
    data: [
      {
        userId: teacher.id,
        type: 'GRADING_DONE',
        title: 'Bewertung abgeschlossen',
        message: 'Die KI-Bewertung für "Mathematik Klasse 10a" ist fertig.',
        isRead: false,
        link: '/grading/history',
      },
      {
        userId: teacher.id,
        type: 'QUOTA_WARNING',
        title: 'Kontingent fast aufgebraucht',
        message: 'Sie haben 80% Ihres monatlichen Kontingents verbraucht.',
        isRead: false,
        link: '/settings/subscription',
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Demo notifications created')

  // Demo support ticket
  await prisma.supportTicket.upsert({
    where: { id: 'demo-ticket-1' },
    update: {},
    create: {
      id: 'demo-ticket-1',
      userId: teacher.id,
      subject: 'Frage zur Handschrifterkennung',
      status: 'OPEN',
      priority: 'MEDIUM',
      messages: JSON.stringify([
        {
          sender: 'user',
          message: 'Wie gut funktioniert die OCR bei schlechter Handschrift?',
          createdAt: new Date().toISOString(),
        },
      ]),
    },
  })
  console.log('✅ Demo support ticket')

  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Credentials:')
  console.log('  Admin:   admin@teachai.de / Admin1234!')
  console.log('  Teacher: lehrer@teachai.de / Teacher1234!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
