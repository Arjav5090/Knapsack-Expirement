"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectMongo(uri) {
    if (mongoose_1.default.connection.readyState === 1)
        return;
    try {
        await mongoose_1.default.connect(uri, {
            autoIndex: true,
            serverSelectionTimeoutMS: 10000,
            ssl: true,
            tls: true,
            tlsAllowInvalidCertificates: false, // stricter, ensures proper handshake
        });
        console.log('[mongo] ✅ connected');
    }
    catch (err) {
        console.error('[mongo] ❌ connection failed:', err);
        throw err;
    }
}
