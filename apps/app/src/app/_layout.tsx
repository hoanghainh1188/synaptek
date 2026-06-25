import "../global.css";

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BeVietnamPro_800ExtraBold, useFonts } from "@expo-google-fonts/be-vietnam-pro";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";

export default function RootLayout() {
  // Font display = Be Vietnam Pro (hỗ trợ ĐẦY ĐỦ dấu tiếng Việt); body = Nunito.
  // FOUT: render ngay với fallback, đổi sang font thật khi sẵn sàng.
  useFonts({
    Display: BeVietnamPro_800ExtraBold,
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
