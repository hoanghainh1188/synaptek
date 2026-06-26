// Phát hiện "giảm chuyển động" (a11y) — dùng chung web + native qua AccessibilityInfo.
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** true khi người dùng bật "Reduce Motion" ở hệ điều hành/trình duyệt. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
