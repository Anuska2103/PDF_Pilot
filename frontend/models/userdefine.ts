import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide user name"],
        unique: true
    },
    email: {
        type: String,
        required: [true, "Please provide email address"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please provide a strong password"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    forgotTokenpassword: String,
    forgotTokenpasswordExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
}, {
    timestamps: true, // This will add createdAt and updatedAt fields
    collection: 'user' // Explicitly specify collection name to prevent auto-pluralization
})

// Use consistent naming - both should be "user"
const User = mongoose.models.user || mongoose.model("user", userSchema)

export default User