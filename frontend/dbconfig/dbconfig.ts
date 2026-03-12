import mongoose from "mongoose";

declare global {
    var mongoose: {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Connection> | null;
    };
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable in .env.local");
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, opts)
            .then((mongoose) => {
                console.log("MongoDB connected successfully");
                return mongoose.connection;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error("MongoDB connection error:", error);
        throw error;
    }

    mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error. Make sure it is running: " + err);
        process.exit(1);
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });

    return cached.conn;
}