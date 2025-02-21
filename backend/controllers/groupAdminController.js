import GroupAdmin from '../models/GroupAdmin.js';
import Activity from "../models/Activity.js";
import mongoose from "mongoose"; 
// export const getActivitiesByGroup = async (req, res) => {
//     try {
//         const { groupId } = req.params;

//         // Kiểm tra ID nhóm có hợp lệ không
//         if (!mongoose.Types.ObjectId.isValid(groupId)) {
//             return res.status(400).json({ status: 400, message: "ID nhóm không hợp lệ!" });
//         }

//         // Kiểm tra xem nhóm có tồn tại không
//         const group = await GroupAdmin.findById(groupId);
//         if (!group) {
//             return res.status(404).json({ status: 404, message: "Nhóm không tồn tại!" });
//         }

//         // 🔍 Lấy danh sách hoạt động thuộc nhóm
//         const activities = await Activity.find({ group: groupId })
//             .populate("created_by", "name email") // Lấy thông tin người tạo
//             .sort({ date: -1 }); // Sắp xếp theo ngày mới nhất

//         res.status(200).json({
//             status: 200,
//             message: `Danh sách hoạt động của nhóm ${group.name}`,
//             activities
//         });

//     } catch (error) {
//         console.error("❌ Lỗi lấy danh sách hoạt động:", error);
//         res.status(500).json({ status: 500, message: "Lỗi lấy danh sách hoạt động", error: error.message });
//     }
// };

// Tạo nhóm mới
export const createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        const createdBy = req.user.id;

        const newGroup = new GroupAdmin({ name, description, createdBy });
        await newGroup.save();

        res.status(201).json({ message: "Nhóm đã được tạo", group: newGroup });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tạo nhóm", error: error.message });
    }
};

// Lấy danh sách nhóm
export const getGroups = async (req, res) => {
    try {
        const groups = await GroupAdmin.find().populate('createdBy', 'name email');
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách nhóm", error: error.message });
    }
};

// Thêm thành viên vào nhóm
export const addMember = async (req, res) => {
    try {
        const { groupId, userId } = req.body;

        const group = await GroupAdmin.findById(groupId);
        if (!group) return res.status(404).json({ message: "Không tìm thấy nhóm" });

        if (group.members.includes(userId)) {
            return res.status(400).json({ message: "Người dùng đã có trong nhóm" });
        }

        group.members.push(userId);
        await group.save();

        res.status(200).json({ message: "Đã thêm thành viên vào nhóm", group });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi thêm thành viên", error: error.message });
    }
};

// Xóa thành viên khỏi nhóm
export const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.body;

        const group = await GroupAdmin.findById(groupId);
        if (!group) return res.status(404).json({ message: "Không tìm thấy nhóm" });

        group.members = group.members.filter(member => member.toString() !== userId);
        await group.save();

        res.status(200).json({ message: "Đã xóa thành viên khỏi nhóm", group });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa thành viên", error: error.message });
    }
};

// Xóa nhóm
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await GroupAdmin.findByIdAndDelete(groupId);
        if (!group) return res.status(404).json({ message: "Không tìm thấy nhóm" });

        res.status(200).json({ message: "Nhóm đã bị xóa" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa nhóm", error: error.message });
    }
};
// export const getActivitiesByGroup = async (req, res) => {
//     try {
//         let { groupIds } = req.body; // Lấy danh sách groupIds từ body

//         if (!Array.isArray(groupIds) || groupIds.length === 0) {
//             return res.status(400).json({ status: 400, message: "Danh sách groupIds không hợp lệ!" });
//         }

//         // Kiểm tra và lọc các groupId hợp lệ
//         groupIds = groupIds.filter(id => mongoose.Types.ObjectId.isValid(id));
//         if (groupIds.length === 0) {
//             return res.status(400).json({ status: 400, message: "Không có ID nhóm nào hợp lệ!" });
//         }

//         // Kiểm tra xem nhóm có tồn tại không
//         const groups = await GroupAdmin.find({ _id: { $in: groupIds } });
//         if (groups.length === 0) {
//             return res.status(404).json({ status: 404, message: "Không tìm thấy nhóm nào!" });
//         }

//         // 🔍 Lấy danh sách hoạt động của các nhóm
//         const activities = await Activity.find({ group: { $in: groupIds } })
//             .populate("created_by", "name email") // Lấy thông tin người tạo
//             .sort({ date: -1 }); // Sắp xếp theo ngày mới nhất

//         res.status(200).json({
//             status: 200,
//             message: `Danh sách hoạt động của các nhóm`,
//             activities
//         });

//     } catch (error) {
//         console.error("❌ Lỗi lấy danh sách hoạt động:", error);
//         res.status(500).json({ status: 500, message: "Lỗi lấy danh sách hoạt động", error: error.message });
//     }
// };


// export const getActivitiesByGroup = async (req, res) => {
//     try {
//         const { groupIds } = req.body;

//         // Kiểm tra xem danh sách groupIds có hợp lệ không
//         if (!Array.isArray(groupIds) || groupIds.length === 0) {
//             return res.status(400).json({ status: 400, message: "Danh sách groupId không hợp lệ!" });
//         }

//         // Lọc những groupId hợp lệ
//         const validGroupIds = groupIds.filter(id => mongoose.Types.ObjectId.isValid(id));
//         if (validGroupIds.length === 0) {
//             return res.status(400).json({ status: 400, message: "Không có groupId hợp lệ!" });
//         }

//         // 🔍 Tìm danh sách nhóm
//         const groups = await GroupAdmin.find({ _id: { $in: validGroupIds } })
//             .populate("createdBy", "name email") // Lấy thông tin người tạo
//             .populate("members", "_id") // Lấy danh sách ID thành viên
//             .populate("activities", "_id"); // Lấy danh sách ID hoạt động

//         res.status(200).json(groups);

//     } catch (error) {
//         console.error("❌ Lỗi lấy danh sách hoạt động:", error);
//         res.status(500).json({ status: 500, message: "Lỗi lấy danh sách hoạt động", error: error.message });
//     }
// };

export const getActivitiesByGroup = async (req, res) => {
    try {
        const { groupIds } = req.body;

        // Kiểm tra danh sách groupIds hợp lệ
        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({ status: 400, message: "Danh sách groupId không hợp lệ!" });
        }

        // Lọc groupIds hợp lệ
        const validGroupIds = groupIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validGroupIds.length === 0) {
            return res.status(400).json({ status: 400, message: "Không có groupId hợp lệ!" });
        }

        // 🔍 Tìm danh sách nhóm và populate thông tin
        const groups = await GroupAdmin.find({ _id: { $in: validGroupIds } })
            .populate("createdBy", "name email") // Lấy thông tin người tạo
            .populate("members", "_id") // Lấy danh sách ID thành viên
            .populate({
                path: "activities",
                select: "_id name" // Lấy cả ID và tên hoạt động
            });

        res.status(200).json(groups);

    } catch (error) {
        console.error("❌ Lỗi lấy danh sách hoạt động:", error);
        res.status(500).json({ status: 500, message: "Lỗi lấy danh sách hoạt động", error: error.message });
    }
};
