// Lời đánh giá kết thúc phiên — THUẦN, theo TỈ LỆ ĐIỂM 0..1 (đón điểm thành phần, khớp % donut). Test
// được. Giữ giọng KHÔNG phán xét (app trẻ em): kể cả 0 điểm vẫn động viên, nhưng lời PHẢI phản ánh
// đúng kết quả (trước đây là 1 câu cố định "Em tiến bộ rồi đó" cho mọi mức điểm → thấy sai lệch).
export function ratingMessage(ratio: number): string {
  if (ratio >= 1) return "Xuất sắc! Em làm đúng hết! 🌟";
  if (ratio >= 0.8) return "Giỏi lắm, gần trọn vẹn! 🎉";
  if (ratio >= 0.5) return "Khá tốt — cố thêm chút nữa nhé! 💪";
  if (ratio > 0) return "Cùng ôn lại để tiến bộ hơn nhé! 📚";
  return "Không sao đâu, luyện thêm sẽ giỏi thôi! 🌱";
}
