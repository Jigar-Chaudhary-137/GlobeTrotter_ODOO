const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GlobeTrotter database...');

  // ── Demo accounts for hackathon evaluators ────────────────────────────────
  const demoUserPassword = await bcrypt.hash('Demo@123', 10);
  await prisma.user.upsert({
    where: { email: 'demo@globetrotter.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@globetrotter.com',
      password: demoUserPassword,
      city: 'New York',
      country: 'USA',
      bio: 'A demo traveller account for evaluating GlobeTrotter.',
      role: 'USER',
    },
  });
  console.log('Demo user seeded: demo@globetrotter.com');

  const demoAdminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@globetrotter.com' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'admin@globetrotter.com',
      password: demoAdminPassword,
      city: 'San Francisco',
      country: 'USA',
      bio: 'A demo admin account for evaluating GlobeTrotter.',
      role: 'ADMIN',
    },
  });
  console.log('Demo admin seeded: admin@globetrotter.com');
  // ─────────────────────────────────────────────────────────────────────────

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'alex.explorer@globetrotter.com' },
    update: {},
    create: {
      name: 'Alex Explorer',
      email: 'alex.explorer@globetrotter.com',
      password: hashedPassword,
      city: 'San Francisco',
      country: 'USA',
      bio: 'Avid traveler, photography enthusiast, and culture seeker.',
      profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  console.log('User created/found:', user.email);

  // Create demo trip
  const existingTrip = await prisma.trip.findFirst({
    where: { userId: user.id, title: 'European Summer Escape' },
  });

  if (!existingTrip) {
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        title: 'European Summer Escape',
        description: 'A 10-day journey exploring historic landmarks, world-class cuisine, and scenic views across Paris and London.',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-10'),
        totalBudget: 2500,
        status: 'PLANNED',
        isPublic: true,
        stops: {
          create: [
            {
              city: 'Paris',
              country: 'France',
              arrivalDate: new Date('2026-09-01'),
              departureDate: new Date('2026-09-05'),
              order: 1,
              notes: 'Arrive at CDG airport, check into hotel in Le Marais.',
            },
            {
              city: 'London',
              country: 'United Kingdom',
              arrivalDate: new Date('2026-09-06'),
              departureDate: new Date('2026-09-10'),
              order: 2,
              notes: 'Eurostar train from Paris Nord to London St Pancras.',
            },
          ],
        },
      },
      include: {
        stops: true,
      },
    });

    const parisStop = trip.stops.find((s) => s.city === 'Paris');
    const londonStop = trip.stops.find((s) => s.city === 'London');

    // Create Itinerary Items
    await prisma.itineraryItem.createMany({
      data: [
        {
          tripId: trip.id,
          tripStopId: parisStop?.id,
          dayNumber: 1,
          date: new Date('2026-09-01'),
          time: '09:00',
          title: 'Eiffel Tower Summit Visit',
          description: 'Ascend to top of Eiffel Tower for panoramic views of Paris.',
          category: 'ACTIVITIES',
          expense: 40,
          location: 'Champ de Mars, Paris',
        },
        {
          tripId: trip.id,
          tripStopId: parisStop?.id,
          dayNumber: 1,
          date: new Date('2026-09-01'),
          time: '13:00',
          title: 'Bistro Lunch in Saint-Germain',
          description: 'Classic French lunch with duck confit and creme brulee.',
          category: 'MEALS',
          expense: 55,
          location: 'Saint-Germain-des-Pres',
        },
        {
          tripId: trip.id,
          tripStopId: parisStop?.id,
          dayNumber: 2,
          date: new Date('2026-09-02'),
          time: '10:00',
          title: 'Louvre Museum Tour',
          description: 'Explore Mona Lisa, Venus de Milo, and Winged Victory.',
          category: 'ACTIVITIES',
          expense: 30,
          location: 'Musée du Louvre',
        },
        {
          tripId: trip.id,
          tripStopId: londonStop?.id,
          dayNumber: 6,
          date: new Date('2026-09-06'),
          time: '10:00',
          title: 'Tower of London & Crown Jewels',
          description: 'Guided tour of medieval fortress and royal armor.',
          category: 'ACTIVITIES',
          expense: 35,
          location: 'Tower Hill, London',
        },
      ],
    });

    // Create Standalone Expenses
    await prisma.expense.createMany({
      data: [
        {
          tripId: trip.id,
          category: 'TRANSPORT',
          amount: 450,
          currency: 'USD',
          description: 'Flight SF to Paris round-trip',
          date: new Date('2026-09-01'),
        },
        {
          tripId: trip.id,
          category: 'TRANSPORT',
          amount: 120,
          currency: 'USD',
          description: 'Eurostar Train Ticket (Paris to London)',
          date: new Date('2026-09-06'),
        },
        {
          tripId: trip.id,
          category: 'ACCOMMODATION',
          amount: 800,
          currency: 'USD',
          description: 'Le Marais Boutique Hotel (4 nights)',
          date: new Date('2026-09-01'),
        },
      ],
    });

    console.log('Sample public trip created successfully:', trip.title);
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
