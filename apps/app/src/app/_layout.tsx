import "../global.css";

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Fredoka_600SemiBold, useFonts } from "@expo-google-fonts/fredoka";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";

export default function RootLayout() {
  // Nạp font (FOUT: render ngay với fallback, đổi sang Fredoka/Nunito khi sẵn sàng).
  useFonts({
    Fredoka: Fredoka_600SemiBold,
    Nunito: Nunito_400Regular,
    "Nunito-Bold": Nunito_700Bold,
  });
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#fbfbfd" },
        }}
      />
    </SafeAreaProvider>
  );
}
