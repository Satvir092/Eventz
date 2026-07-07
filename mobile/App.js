import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
 
import RootNavigator from "./src/navigation";
import { SocketProvider } from "./src/context/SocketContext";
 
export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Auth");
 
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("authToken");
      setInitialRoute(token ? "Map" : "Auth");
      setCheckingAuth(false);
    })();
  }, []);
 
  if (checkingAuth) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
 
  return (
    <SafeAreaProvider>
      <SocketProvider>
        <RootNavigator initialRouteName={initialRoute} />
      </SocketProvider>
    </SafeAreaProvider>
  );
}
