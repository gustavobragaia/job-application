import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useUser } from "../src/context/user";

export default function AuthGate() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
