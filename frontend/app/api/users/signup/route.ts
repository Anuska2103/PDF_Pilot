import User from "@/models/userdefine";
import { connect } from "@/dbconfig/dbconfig"

import { NextRequest, NextResponse } from "next/server";    
import bcryptjs from "bcryptjs";

/*function*/
export async function POST(request: NextRequest){
    try {
        // Connect to database first
        await connect();
        console.log("Database connected for signup");

        const reqBody = await request.json();
        const { password, email, username } = reqBody;
        console.log("Signup request data:", reqBody);

        // Validate required fields
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Username, email, and password are required" },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (user) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hash
        });

        const savedUser = await newUser.save();
        console.log("User saved successfully:", savedUser);
        
        return NextResponse.json({
            message: "User created and saved successfully",
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                isVerified: savedUser.isVerified
            }
        });
        
    } catch (error: any) {
        console.error("Signup error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

