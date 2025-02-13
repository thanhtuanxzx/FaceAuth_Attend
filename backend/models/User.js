import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false } ,
    role: { type: String, enum: ["super_admin", "admin", "student"], required: true },
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
export default User;
