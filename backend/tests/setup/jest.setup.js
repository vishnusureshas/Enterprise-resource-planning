// Jest global setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'erp_test';
process.env.DB_USER = 'erp_user';
process.env.DB_PASSWORD = 'test_pass';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';