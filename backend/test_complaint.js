import axios from 'axios';

const testComplaint = async () => {
    try {
        // Mock a citizen login token first
        const loginRes = await axios.post('http://localhost:5000/api/users/login', {
            mobile: '1234567890',
            password: 'password123'
        });
        const token = loginRes.data.token;

        // Submit grievance 
        const res = await axios.post('http://localhost:5000/api/complaints', {
            title: 'Excessive garbage pileup near school',
            description: 'There is a massive amount of uncollected garbage rotting outside the primary school.',
            district: 'Agra',
            block: 'Dayal Bagh'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('--- SUBMIT RESULTS ---');
        console.log(`Department: ${res.data.complaint.department}`);
        console.log(`Priority: ${res.data.complaint.priority}`);
        console.log(`Assigned Level: ${res.data.complaint.assignedToLevel}`);
        console.log(`SLA Deadline: ${res.data.complaint.slaDueDate}`);
        console.log(`Complaint ID: ${res.data.complaint._id}`);

    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
};

testComplaint();
