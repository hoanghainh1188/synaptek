// Lời đánh giá kết thúc phiên — THUẦN, theo tỉ lệ đúng (khớp donut correct/total). Test được.
// Giữ giọng KHÔNG phán xét (app trẻ em): kể cả 0 điểm vẫn động viên, nhưng lời PHẢI phản ánh đúng
// kết quả (trước đây là 1 câu cố định "Em tiến bộ rồi đó" cho mọi mức điểm → thấy sai lệch).
export function ratingMessage(correct: number, total: number): string {
  if (total === 0) return "Cùng bắt đầu luyện tập nhé!";
  const pct = correct / total;
  if (pct >= 1) return "Xuất sắc! Em làm đúng hết! 🌟";
  if (pct >= 0.8) return "Giỏi lắm, gần trọn vẹn! 🎉";
  if (pct >= 0.5) return "Khá tốt — cố thêm chút nữa nhé! 💪";
  if (pct > 0) return "Cùng ôn lại để tiến bộ hơn nhé! 📚";
  return "Không sao đâu, luyện thêm sẽ giỏi thôi! 🌱";
}
