// Form đăng nhập/đăng ký email-mật khẩu (US2, T031).
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "@/lib/supabase/auth";

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View>
      <Text className="mb-1 text-sm font-bold text-muted">{label}</Text>
      <TextInput
        className="min-h-[52px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
        placeholderTextColor="#a1a1aa"
        {...rest}
      />
    </View>
  );
}

export function AuthForm({ onDone }: { onDone: () => void }) {
  const { signIn, signUp, enabled } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <View className="rounded-lg bg-surface p-5 shadow-sm">
        <Text className="font-display text-lg font-bold text-ink">Chưa bật đăng nhập</Text>
        <Text className="mt-2 text-sm text-muted">
          Tạo `apps/app/.env` (xem `.env.example`) rồi `supabase start` để bật. Hiện bạn vẫn luyện
          tập được ở chế độ khách.
        </Text>
      </View>
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const res =
      mode === "in"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim(), role);
    setBusy(false);
    if (res.error) setError(res.error);
    else onDone();
  }

  return (
    <View className="gap-3">
      <Text className="font-display text-2xl font-extrabold text-ink">
        {mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}
      </Text>
      {mode === "up" && (
        <>
          <Field label="Họ tên" value={name} onChangeText={setName} placeholder="Tên của em" />
          <View>
            <Text className="mb-1 text-sm font-bold text-muted">Bạn là</Text>
            <View className="flex-row gap-2">
              {(
                [
                  ["student", "Học sinh"],
                  ["teacher", "Giáo viên"],
                  ["parent", "Phụ huynh"],
                ] as const
              ).map(([value, label]) => {
                const active = role === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityLabel={label}
                    onPress={() => setRole(value)}
                    className={`min-h-[48px] flex-1 items-center justify-center rounded-md border-2 ${active ? "border-brand bg-brand/10" : "border-line bg-surface"}`}
                  >
                    <Text
                      className={`font-display font-bold ${active ? "text-brand" : "text-muted"}`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="email@vidu.com"
      />
      <Field
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••"
      />
      {error && <Text className="text-sm font-semibold text-no">{error}</Text>}
      <Pressable
        onPress={submit}
        disabled={busy}
        className="min-h-[52px] items-center justify-center rounded-md bg-brand"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-display text-lg font-bold text-white">
            {mode === "in" ? "Đăng nhập" : "Đăng ký"}
          </Text>
        )}
      </Pressable>
      <Pressable onPress={() => setMode(mode === "in" ? "up" : "in")}>
        <Text className="text-center text-sm font-semibold text-muted">
          {mode === "in" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </Text>
      </Pressable>
    </View>
  );
}
