import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { ApplicationsProvider } from "../src/context/applications";
import { UserProvider } from "../src/context/user";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
        <UserProvider>
            <ApplicationsProvider>
                <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />

                {/* Details por cima */}
                <Stack.Screen name="applications/[id]" options={{ headerShown: false }} />

                {/* Modal */}
                <Stack.Screen
                    name="(modals)/create"
                    options={{
                        presentation: "transparentModal",
                        animation: "slide_from_bottom",
                        headerShown: false,
                        contentStyle: { backgroundColor: "transparent" },
                    }}
                />
                </Stack>
            </ApplicationsProvider>
        </UserProvider>
    </SafeAreaProvider>
  );
}
