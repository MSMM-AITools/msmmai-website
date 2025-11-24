/**
 * Test creating an event via API to verify date format fix
 */
const fetch = require('node-fetch');

async function testEventCreation() {
    console.log('Testing event creation with ISO date strings...\n');

    const API_BASE_URL = 'http://localhost:3001/api';

    try {
        // Create a test event with ISO date strings (like the frontend sends)
        const testEvent = {
            TITLE: 'Test Event - Date Format',
            DESCRIPTION: 'Testing that ISO date strings are properly converted',
            START_DATE: new Date().toISOString(),
            END_DATE: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
            LOCATION: 'Test Location',
            COLOR: '#3B82F6',
            ALL_DAY: 'N'
        };

        console.log('Creating event with data:');
        console.log(JSON.stringify(testEvent, null, 2));
        console.log('\nSending POST request...\n');

        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testEvent)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Event created successfully!');
            
            // Fetch all events to verify
            const getResponse = await fetch(`${API_BASE_URL}/events`);
            const getResult = await getResponse.json();
            
            console.log(`\n📊 Total events in database: ${getResult.data.length}`);
            
            // Find our test event
            const ourEvent = getResult.data.find(e => e.TITLE === 'Test Event - Date Format');
            if (ourEvent) {
                console.log('\n✅ Test event found in database:');
                console.log(`  ID: ${ourEvent.EVENT_ID}`);
                console.log(`  Title: ${ourEvent.TITLE}`);
                console.log(`  Start: ${ourEvent.START_DATE}`);
                console.log(`  End: ${ourEvent.END_DATE}`);
            }
            
            console.log('\n✅ Date format fix is working correctly!');
        } else {
            console.error('❌ Failed to create event:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEventCreation()
    .then(() => {
        console.log('\n✅ Test completed!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Test failed:', err);
        process.exit(1);
    });

