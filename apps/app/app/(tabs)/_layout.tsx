import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

function TabLabel({ text }: { text: string }) {
  return <Text style={{ fontSize: 12 }}>{text}</Text>;
}

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
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#09090b" }}>+</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => <TabLabel text="Home" />,
        }}
      />

      {/* Esse “tab” do meio é só um botão */}
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

      <Tabs.Screen
        name="settings"
        options={{
          title: "Config",
          tabBarIcon: () => <TabLabel text="Config" />,
        }}
      />
    </Tabs>
  );
}
