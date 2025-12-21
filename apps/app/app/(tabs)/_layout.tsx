import { useEffect } from "react";
import { Tabs, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../src/context/user";

function PlusButton() {
  return (
    <Pressable
      onPress={() => router.push("/(modals)/create")}
      style={{
        marginTop: -18,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#10b981", // emerald-500
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#09090b" }}>
        +
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // ✅ REMOVE TEXTO
        tabBarStyle: {
          backgroundColor: "#09090b",
          borderTopColor: "#27272a",
          height: 84,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#a1a1aa",
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* BOTÃO CENTRAL (+) */}
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarButton: () => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <PlusButton />
            </View>
          ),
        }}
      />

      {/* SETTINGS */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
