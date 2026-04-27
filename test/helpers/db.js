"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTestDatabaseReady = ensureTestDatabaseReady;
exports.truncateUsersTable = truncateUsersTable;
exports.closeTestDatabase = closeTestDatabase;
const db_1 = require("../../src/config/db");
const initDb_1 = require("../../src/config/initDb");
async function ensureTestDatabaseReady() {
    await (0, initDb_1.initializeDatabase)();
}
async function truncateUsersTable() {
    await (0, db_1.query)('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
}
async function closeTestDatabase() {
    await (0, db_1.getPool)().end();
}
