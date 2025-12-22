import { useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { router, Link } from "expo-router";
import { useUser } from "../../src/context/user";
import { registerUser } from "../../src/services/auth";

export default function Register() {
  const { signIn } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Fill in name, email and password.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      await signIn(email.trim(), password); // ensure context has user
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b", padding: 20, justifyContent: "center", gap: 16 }}>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>Create account</Text>

      <View style={{ gap: 10 }}>
        <TextInput
          placeholder="Name"
          placeholderTextColor="#71717a"
          value={name}
          onChangeText={setName}
          style={{
            backgroundColor: "#18181b",
            borderColor: "#27272a",
            borderWidth: 1,
            color: "white",
            padding: 14,
            borderRadius: 14,
          }}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#71717a"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={{
            backgroundColor: "#18181b",
            borderColor: "#27272a",
            borderWidth: 1,
            color: "white",
            padding: 14,
            borderRadius: 14,
          }}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#71717a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: "#18181b",
            borderColor: "#27272a",
            borderWidth: 1,
            color: "white",
            padding: 14,
            borderRadius: 14,
          }}
        />
      </View>

      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}

      <Pressable
        style={{
          backgroundColor: isSubmitting ? "#16a34a80" : "#10b981",
          padding: 16,
          borderRadius: 16,
          alignItems: "center",
        }}
        disabled={isSubmitting}
        onPress={handleRegister}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#0b0b0f" />
        ) : (
          <Text style={{ color: "#09090b", fontWeight: "800" }}>Create account</Text>
        )}
      </Pressable>

      <View style={{ flexDirection: "row", gap: 6 }}>
        <Text style={{ color: "#a1a1aa" }}>Already have an account?</Text>
        <Link href="/(auth)/login" style={{ color: "#10b981", fontWeight: "700" }}>
          Sign in
        </Link>
      </View>
    </View>
  );
}
