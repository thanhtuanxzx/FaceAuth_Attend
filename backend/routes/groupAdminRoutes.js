import express from 'express';
import { createGroup, getGroups, addMember, removeMember, deleteGroup ,getActivitiesByGroup} from '../controllers/groupAdminController.js';

import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/create', authenticateUser,authorizeRoles("super_admin") ,createGroup);
router.get('/list', getGroups);
router.post('/add-member', authenticateUser, addMember);
router.post('/remove-member', authenticateUser, removeMember);
router.delete('/delete/:groupId', authenticateUser, deleteGroup);
router.post("/activities", authenticateUser, getActivitiesByGroup);
export default router;
