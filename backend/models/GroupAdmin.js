import mongoose from 'mongoose';

const GroupAdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    activities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now }
});

// Sử dụng export default
const GroupAdmin = mongoose.model('GroupAdmin', GroupAdminSchema);
export default GroupAdmin;
