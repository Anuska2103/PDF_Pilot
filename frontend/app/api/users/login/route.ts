import User from "@/models/userdefine";
import { connect } from "@/dbconfig/dbconfig"
import { NextRequest, NextResponse } from "next/server";    
import bcryptjs from "bcryptjs";
import { error } from "console";
import  jwt  from "jsonwebtoken";
export async function POST(request: NextRequest){
    try {
        await connect();
        console.log("Database connected for signup");


        const reqBody = await request.json();
        const { password,  username } = reqBody;
        console.log("Login request data:", reqBody);

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json(
            { error: "Username and password are required" },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await User.findOne({ username});
        if (!user) {
            return NextResponse.json(
                { error: "User does not exist "},
                { status: 400 }
            );
        }
        //check if pass word is correct otnot
        const validPassword=await bcryptjs.compare(password,user.password)
        if(!validPassword){
            return NextResponse.json({
                error: "Invalid paasswod. Please entercorrect password"},{status:400})

        }
        // create token data
        const tokenData={
            id:user._id,
            username: user.username,
            email: user.email
        }
        //create token
        const token= await jwt.sign(tokenData,process.env.TOKEN_KEY!, {expiresIn: "2d"})


        const response=NextResponse.json({
            message: "login sussessful",
            success: true,
        })
        response.cookies.set("token",token,{
            httpOnly: true,
        })
        return response;

    } catch (error:any) {
        return NextResponse.json({error:error.message},{status:500})
    }
}