const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

export const API_ROUTES = {
    // Auth
    LOGIN: `${API_BASE_URL}/api/users/login`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
    CITIZENS: `${API_BASE_URL}/api/users/citizens`,
    OFFICIALS: `${API_BASE_URL}/api/users/officials`,
    
    // Locations
    DISTRICTS: `${API_BASE_URL}/api/users/locations/districts`,
    BLOCKS: (district: string) => `${API_BASE_URL}/api/users/locations/blocks/${district}`,
    VILLAGES: (district: string, block: string) => `${API_BASE_URL}/api/users/locations/villages/${district}/${block}`,
    
    // Complaints
    COMPLAINTS: `${API_BASE_URL}/api/complaints`,
    MY_COMPLAINTS: `${API_BASE_URL}/api/complaints/my`,
    RECENT: `${API_BASE_URL}/api/complaints/recent`,
    ANALYTICS: `${API_BASE_URL}/api/complaints/analytics`,
    WEEKLY: `${API_BASE_URL}/api/complaints/weekly`,
    DEPT_LOAD: `${API_BASE_URL}/api/complaints/departments/load`,
    ESCALATIONS: `${API_BASE_URL}/api/complaints/escalations/active`,
    ADMIN_LIST: `${API_BASE_URL}/api/complaints/admin`,
    
    // Masters/Public
    PUBLIC_STATS: `${API_BASE_URL}/api/master/public/stats`,
    LEADERBOARD: `${API_BASE_URL}/api/master/public/leaderboard`,
    PUBLIC_RECENT: `${API_BASE_URL}/api/master/public/recent`,
    HEATMAP: `${API_BASE_URL}/api/master/heatmap`,
    
    // Services
    UPLOAD: `${API_BASE_URL}/api/upload`,
    EVENT_STREAM: `${API_BASE_URL}/api/events/stream`,
    GENERATE_RESPONSE: `${AI_SERVICE_URL}/api/generate-response`,
    
    // Static
    UPLOADS: (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`
};

export default API_ROUTES;
