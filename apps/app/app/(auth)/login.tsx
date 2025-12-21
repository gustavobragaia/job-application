import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useUser } from "../../src/context/user";

export default function Login() {
  const { signIn } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b", padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>Login</Text>

      <Pressable
        style={{ backgroundColor: "#10b981", padding: 16, borderRadius: 16, alignItems: "center" }}
        onPress={async () => {
          await signIn("teste@teste.com", "123456");
          router.replace("/(tabs)");
        }}
      >
        <Text style={{ color: "#09090b", fontWeight: "800" }}>Entrar (teste)</Text>
      </Pressable>
    </View>
  );
}
