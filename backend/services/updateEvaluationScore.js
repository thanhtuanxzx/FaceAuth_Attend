import Evaluation from "../models/Evaluation.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import DisciplinaryRecord from "../models/DisciplinaryRecord.js";

// Định nghĩa quy tắc chấm điểm
const SCORING_RULES = {
  "1a": { base: 7, absentPenalty: 1, latePenalty: 1 / 3 }, // Nghỉ học không phép trừ 1 điểm, đi muộn mỗi 3 lần trừ 1 điểm
  "1b": { base: 2, perActivity: 1 }, // Mỗi hoạt động CLB, ngoại khóa được +1 điểm (tối đa 2 điểm)
  "1c": { base: 4 }, // Ý thức thi cử
  "1d": { base: 2 }, // Tinh thần vượt khó
  "1đ": { base: 5, gpaMapping: { "0-1.9": 0, "2-2.49": 2, "2.5-3.19": 3, "3.2-3.59": 4, "3.6-4.0": 5 } }, // Điểm GPA quy đổi
  "2a": { base: 15, warningPenalty: 5, disciplinePenalty: 15 }, // Kỷ luật trừ điểm
  "2b": { base: 10, warningPenalty: 5, disciplinePenalty: 10 },
  "3a": { base: 0, activeParticipation: 5, specialBonus: 8 },
  "3b": { base: 6 }, // Tham gia tình nguyện
  "3c": { base: 6 }, // Tuyên truyền phòng chống tội phạm
  "4a": { base: 10 }, // Chấp hành pháp luật
  "4b": { base: 5 }, // Khen thưởng
  "4c": { base: 10 }, // Giúp đỡ cộng đồng
  "5a": { base: 3 }, // Công tác lớp
  "5b": { base: 3 }, // Cán bộ lớp, đoàn hội
  "5c": { base: 2 }, // Đóng góp hiệu quả
  "5d": { base: 2 }, // Khen thưởng
};

async function updateEvaluationScore(userId, semester) {
  // Lấy thông tin sinh viên
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Sinh viên không tồn tại.");
  }

  let totalScore = 0;
  const criteriaScores = {};

  // 1. Tính điểm "1a" - Ý thức, thái độ trong học tập
  const attendanceRecords = await AttendanceRecord.find({ student_id: userId });
  let absentCount = 0;
  let lateCount = 0;
  attendanceRecords.forEach(record => {
    if (record.status === "absent") absentCount++;
    if (record.status === "late") lateCount++;
  });
  let studyAwarenessScore = SCORING_RULES["1a"].base;
  studyAwarenessScore -= absentCount * SCORING_RULES["1a"].absentPenalty;
  studyAwarenessScore -= Math.floor(lateCount / 3) * SCORING_RULES["1a"].latePenalty;
  criteriaScores["1a"] = studyAwarenessScore;
  totalScore += studyAwarenessScore;

  // 2. Tính điểm "1b" - Tham gia các câu lạc bộ học thuật; các hoạt động ngoại khóa
  const activities = await Activity.find({ category: "1b" });
  const activityParticipationScore = Math.min(activities.length * SCORING_RULES["1b"].perActivity, SCORING_RULES["1b"].base);
  criteriaScores["1b"] = activityParticipationScore;
  totalScore += activityParticipationScore;

  // 3. Tính điểm "1c" - Ý thức thi cử (Dựa trên kỷ luật)
  const disciplinaryRecords = await DisciplinaryRecord.find({ user_id: userId });
  let examRegulationScore = SCORING_RULES["1c"].base;
  disciplinaryRecords.forEach(record => {
    if (record.type === "warning") examRegulationScore -= SCORING_RULES["1c"].penalty;
    if (record.type === "discipline") examRegulationScore -= SCORING_RULES["1c"].penalty * 2;
  });
  criteriaScores["1c"] = examRegulationScore;
  totalScore += examRegulationScore;

  // 4. Tính điểm "1d" - Tinh thần vượt khó, phấn đấu vươn lên
  const overcomingDifficultyScore = SCORING_RULES["1d"].base; // Tính theo số lượng hoạt động tham gia
  criteriaScores["1d"] = overcomingDifficultyScore;
  totalScore += overcomingDifficultyScore;

  // 5. Tính điểm "1đ" - Đạt kết quả học tập (Dựa trên GPA)
  const gpa = user.gpa;
  let gpaScore = 0;
  for (let range in SCORING_RULES["1đ"].gpaMapping) {
    const [minGpa, maxGpa] = range.split("-").map(parseFloat);
    if (gpa >= minGpa && gpa <= maxGpa) {
      gpaScore = SCORING_RULES["1đ"].gpaMapping[range];
      break;
    }
  }
  criteriaScores["1đ"] = gpaScore;
  totalScore += gpaScore;

  // 1. Tính điểm "2a" - Ý thức chấp hành các văn bản chỉ đạo
  const disciplinaryRecordsA = await DisciplinaryRecord.find({ user_id: userId, reason: /văn bản chỉ đạo/i });
  let complianceA = SCORING_RULES["2a"].base;
  disciplinaryRecordsA.forEach(record => {
    if (record.type === "warning") complianceA -= SCORING_RULES["2a"].warningPenalty;
    if (record.type === "discipline") complianceA = SCORING_RULES["2a"].disciplinePenalty;  // 0 điểm nếu bị kỷ luật
  });
  criteriaScores["2a"] = complianceA;
  totalScore += complianceA;

  // 2. Tính điểm "2b" - Ý thức chấp hành các nội quy, quy chế của trường
  const disciplinaryRecordsB = await DisciplinaryRecord.find({ user_id: userId, reason: /nội quy|quy chế/i });
  let complianceB = SCORING_RULES["2b"].base;
  disciplinaryRecordsB.forEach(record => {
    if (record.type === "warning") complianceB -= SCORING_RULES["2b"].warningPenalty;
    if (record.type === "discipline") complianceB = SCORING_RULES["2b"].disciplinePenalty;  // 0 điểm nếu bị kỷ luật
  });
  criteriaScores["2b"] = complianceB;
  totalScore += complianceB;

   // Tiêu chí 3a - Tham gia tích cực các hoạt động chính trị, xã hội, văn hoá, văn nghệ, thể thao
   const activities3a = await Activity.find({ category: "3a" });
   let participationScore = activities3a.length * 1;  // 1 điểm cho mỗi hoạt động tham gia, tối đa 5 điểm
   participationScore = Math.min(participationScore, 5);
 
   // Kiểm tra danh hiệu đặc biệt và giải thưởng
    if (user.specialRecognition === "Đảng viên" || user.specialRecognition === "Đoàn viên ưu tú" || 
      user.awards.some(award => ["Nhất", "Nhì", "Ba"].includes(award))) {
    participationScore = 8;  // Cộng 8 điểm nếu có danh hiệu đặc biệt hoặc giải thưởng
    }


 
   // Tiêu chí 3b - Tích cực tham gia các hoạt động công ích, tình nguyện, công tác xã hội
   const volunteerActivities = await Activity.find({ category: "3b" });
   let volunteerScore = volunteerActivities.length * 1;  // 1 điểm cho mỗi hoạt động tham gia, tối đa 6 điểm
   volunteerScore = Math.min(volunteerScore, 6);
 
   // Tiêu chí 3c - Tham gia tuyên truyền, phòng chống tội phạm, các tệ nạn xã hội
   const antiCrimeActivities = await Activity.find({ category: "3c" });
   let antiCrimeScore = antiCrimeActivities.length * 1;  // 1 điểm cho mỗi hoạt động tham gia, tối đa 6 điểm
   antiCrimeScore = Math.min(antiCrimeScore, 6);
 
   // Cập nhật các điểm tiêu chí 3a, 3b, 3c
   criteriaScores["3a"] = participationScore;
   criteriaScores["3b"] = volunteerScore;
   criteriaScores["3c"] = antiCrimeScore;
   totalScore += participationScore + volunteerScore + antiCrimeScore;

   // Tiêu chí 4 - Ý thức công dân trong quan hệ cộng đồng
  const propagandaScore = 10;  // Mặc định đạt 10 điểm
  const helpingScore = 10;  // Mặc định đạt 10 điểm
  let socialActivityRecognitionScore = 0;
  if (user.awards.includes("other")) {
    socialActivityRecognitionScore = 5;  // Nếu có "other", cộng 5 điểm
  }
  let totalCommunityScore = propagandaScore + socialActivityRecognitionScore + helpingScore;
  criteriaScores["4a"] = propagandaScore;
  criteriaScores["4b"] = socialActivityRecognitionScore;
  criteriaScores["4c"] = helpingScore;
  totalScore += totalCommunityScore;
  

  // 5a: Dựa trên số lượng hoạt động tham gia
const totalActivities = Array.isArray(user.activities) ? user.activities.length : 0;
const participatedActivities = Array.isArray(user.activities) 
    ? user.activities.filter(act => act.participated).length 
    : 0;

// Đảm bảo có giá trị hợp lệ trước khi truy cập
criteriaScores["5a"] = (totalActivities > 0 && participatedActivities / totalActivities >= (SCORING_RULES["5a"].threshold || 0)) 
    ? SCORING_RULES["5a"].base 
    : 0;
totalScore += criteriaScores["5a"];

// 5b: Kiểm tra hoạt động có category = "5b"
criteriaScores["5b"] = Array.isArray(user.activities) && user.activities.some(act => act.category === "5b") 
    ? SCORING_RULES["5b"].base 
    : 0;
totalScore += criteriaScores["5b"];

// 5c: Kiểm tra hoạt động có category = "5c"
criteriaScores["5c"] = Array.isArray(user.activities) && user.activities.some(act => act.category === "5c") 
    ? SCORING_RULES["5c"].base 
    : 0;
totalScore += criteriaScores["5c"];

// 5d: Kiểm tra giải thưởng
let rewardScore = 0;
if (Array.isArray(user.awards) && user.awards.length > 0) {
    rewardScore = SCORING_RULES["5d"].base || 0; // Đảm bảo không bị undefined
    if (user.awards.includes("truong")) {
        rewardScore = SCORING_RULES["5d"].levelMapping?.["truong"] || rewardScore;
    }
}
criteriaScores["5d"] = rewardScore;
totalScore += rewardScore;

  // 6. Tính điểm cho các tiêu chí khác (theo quy tắc tương tự)
  // ...

  // Kiểm tra xem sinh viên đã có bản ghi đánh giá cho học kỳ này chưa
  let evaluation = await Evaluation.findOne({ user_id: userId, semester: semester });

  if (evaluation) {
    // Nếu đã có bản ghi đánh giá, cập nhật điểm mới
    evaluation.criteria = criteriaScores;
    evaluation.total_score = totalScore;
    evaluation.created_at = new Date();
    await evaluation.save();
  } else {
    // Nếu chưa có, tạo mới bản ghi đánh giá
    evaluation = new Evaluation({
      user_id: userId,
      semester: semester,
      criteria: criteriaScores,
      total_score: totalScore,
    });
    await evaluation.save();
  }

  return evaluation; // Trả về bản ghi đánh giá đã cập nhật
}

export default updateEvaluationScore;
