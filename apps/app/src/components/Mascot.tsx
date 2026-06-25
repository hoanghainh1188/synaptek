// Linh vật "Tia" (synapse spark) — react-native-svg, universal.
import Svg, { Circle, Path, Rect } from "react-native-svg";

interface MascotProps {
  size?: number;
  color?: string;
}

export function Mascot({ size = 48, color = "#4f46e5" }: MascotProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Linh vật Tia">
      <Rect x={6} y={8} width={36} height={34} rx={13} fill={color} />
      <Path d="M25 14l-7 11h6l-2 9 9-13h-6z" fill="#fde047" />
      <Circle cx={18} cy={22} r={2.6} fill="#fff" />
      <Circle cx={30} cy={22} r={2.6} fill="#fff" />
    </Svg>
  );
}
