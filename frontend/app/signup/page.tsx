"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
export default function SignupPage() {
    const router = useRouter();
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        if (
            user.email.length > 0 &&
            user.password.length > 0 &&
            user.username.length > 0
        ) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [user]);

    const onSignup = async () => {
        try {
            const response = await axios.post("/api/users/signup", user);
            console.log("Sign up successful", response.data);
            router.push("/login");
            
        } catch (error: any) {
            console.log("Sign up failed", error.message);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-300">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Create an Account
                </h1>

                <div className="flex flex-col gap-4">
                    {/* Username */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={user.username}
                            onChange={(e) =>
                                setUser({ ...user, username: e.target.value })
                            }
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-900"
                        />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={user.email}
                            onChange={(e) =>
                                setUser({ ...user, email: e.target.value })
                            }
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-900"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={user.password}
                            onChange={(e) =>
                                setUser({ ...user, password: e.target.value })
                            }
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={onSignup}
                        disabled={buttonDisabled}
                        className={`mt-2 py-2 px-4 rounded-lg font-semibold text-white transition-all duration-200 
                            ${
                                buttonDisabled
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-zinc-900 hover:bg-zinc-900 cursor-pointer"
                            }`}
                    >
                        {buttonDisabled ? "No Signup" : "Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
