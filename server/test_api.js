const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (_) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting GlobeTrotter Backend API Verification ---');

  // 1. Health Check
  const health = await request('GET', '/api/health');
  console.log('✓ GET /api/health:', health.status === 200 ? 'PASSED' : 'FAILED', health.body);

  // 2. Auth Login (Seed user)
  const login = await request('POST', '/api/auth/login', {
    email: 'alex.explorer@globetrotter.com',
    password: 'password123',
  });
  console.log('✓ POST /api/auth/login:', login.status === 200 ? 'PASSED' : 'FAILED');
  const token = login.body?.data?.token;

  // 3. Auth Register
  const testEmail = `user_${Date.now()}@test.com`;
  const register = await request('POST', '/api/auth/register', {
    name: 'Test Member',
    email: testEmail,
    password: 'password123',
    city: 'Ahmedabad',
    country: 'India',
  });
  console.log('✓ POST /api/auth/register:', register.status === 201 ? 'PASSED' : 'FAILED');
  const newMemberToken = register.body?.data?.token;

  // 4. Auth Me
  const me = await request('GET', '/api/auth/me', null, token);
  console.log('✓ GET /api/auth/me:', me.status === 200 ? 'PASSED' : 'FAILED');

  // 5. Get Trips
  const trips = await request('GET', '/api/trips', null, token);
  console.log('✓ GET /api/trips:', trips.status === 200 ? 'PASSED' : 'FAILED', `Count: ${trips.body?.data?.length}`);
  const seedTrip = trips.body?.data?.[0];

  // 6. Create Trip
  const createTrip = await request(
    'POST',
    '/api/trips',
    {
      title: 'Asian Cultural Odyssey',
      description: 'Exploring Tokyo and Kyoto',
      totalBudget: 3000,
      isPublic: true,
    },
    newMemberToken
  );
  console.log('✓ POST /api/trips:', createTrip.status === 201 ? 'PASSED' : 'FAILED');
  const newTrip = createTrip.body?.data;

  // 7. Add Stop
  const addStop = await request(
    'POST',
    `/api/trips/${newTrip.id}/stops`,
    {
      city: 'Tokyo',
      country: 'Japan',
      arrivalDate: '2026-10-01',
      departureDate: '2026-10-05',
      order: 1,
    },
    newMemberToken
  );
  console.log('✓ POST /api/trips/:tripId/stops:', addStop.status === 201 ? 'PASSED' : 'FAILED');
  const newStop = addStop.body?.data;

  // 8. Add Itinerary Item
  const addItem = await request(
    'POST',
    `/api/trips/${newTrip.id}/itinerary`,
    {
      tripStopId: newStop.id,
      dayNumber: 1,
      time: '09:30',
      title: 'Sensoji Temple Visit',
      category: 'ACTIVITIES',
      expense: 20,
    },
    newMemberToken
  );
  console.log('✓ POST /api/trips/:tripId/itinerary:', addItem.status === 201 ? 'PASSED' : 'FAILED');

  // 9. Get Expenses & Budget
  const expenses = await request('GET', `/api/trips/${newTrip.id}/expenses`, null, newMemberToken);
  console.log(
    '✓ GET /api/trips/:tripId/expenses:',
    expenses.status === 200 ? 'PASSED' : 'FAILED',
    `Total: $${expenses.body?.data?.totalExpense}`
  );

  // 10. Explore Cities
  const cities = await request('GET', '/api/explore/cities?query=paris');
  console.log('✓ GET /api/explore/cities:', cities.status === 200 ? 'PASSED' : 'FAILED');

  // 11. Community Trips
  const community = await request('GET', '/api/community');
  console.log('✓ GET /api/community:', community.status === 200 ? 'PASSED' : 'FAILED', `Count: ${community.body?.data?.length}`);

  // 12. Public Share & Copy
  if (seedTrip && seedTrip.shareId) {
    const publicTrip = await request('GET', `/api/public/trips/${seedTrip.shareId}`);
    console.log('✓ GET /api/public/trips/:shareId:', publicTrip.status === 200 ? 'PASSED' : 'FAILED');

    const copyTrip = await request('POST', `/api/public/trips/${seedTrip.shareId}/copy`, null, newMemberToken);
    console.log('✓ POST /api/public/trips/:shareId/copy:', copyTrip.status === 201 ? 'PASSED' : 'FAILED', `Copied Trip Title: "${copyTrip.body?.data?.title}"`);
  }

  console.log('--- Verification Completed Successfully! ---');
}

runTests().catch(console.error);
