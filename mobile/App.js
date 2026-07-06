import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation";
import { SocketProvider } from "./src/context/SocketContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <SocketProvider>
        <RootNavigator />
      </SocketProvider>
    </SafeAreaProvider>
  );
}
