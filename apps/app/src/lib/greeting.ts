// Lời chào theo buổi trong ngày — THUẦN (nhận giờ 0–23) để test được. Dùng giờ ĐỊA PHƯƠNG của thiết bị.
// Sáng 5–10 · Trưa 11–12 · Chiều 13–17 · Tối 18–4 (gồm 18–23 và 0–4).
export function greetingByHour(hour: number): string {
  if (hour >= 5 && hour <= 10) return "Chào buổi sáng,";
  if (hour >= 11 && hour <= 12) return "Chào buổi trưa,";
  if (hour >= 13 && hour <= 17) return "Chào buổi chiều,";
  return "Chào buổi tối,";
}

/** Lời chào hiện tại theo giờ địa phương của thiết bị. */
export function currentGreeting(now: Date = new Date()): string {
  return greetingByHour(now.getHours());
}
