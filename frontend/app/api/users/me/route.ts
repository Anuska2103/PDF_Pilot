import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        const decoded = jwt.verify(token, process.env.TOKEN_KEY!) as {
            id: string;
            username: string;
            email: string;
        };
        return NextResponse.json({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
}
