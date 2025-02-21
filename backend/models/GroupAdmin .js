const mongoose = require('mongoose');

const GroupAdminSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên nhóm quản trị
    description: { type: String }, // Mô tả nhóm
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách thành viên (liên kết đến User)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người tạo nhóm
    created_at: { type: Date, default: Date.now } // Thời gian tạo nhóm
});

const GroupAdmin = mongoose.model('GroupAdmin', GroupAdminSchema);

module.exports = GroupAdmin;
