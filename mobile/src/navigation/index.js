import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
 
import AuthScreen from "../screens/AuthScreen";
import MapScreen from "../screens/MapScreen";
import CreateEventScreen from "../screens/CreateEventScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
 
const Stack = createNativeStackNavigator();
 
export default function RootNavigator({ initialRouteName }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName || "Auth"}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Log in", headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: "Nearby Events" }} />
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ title: "New Event" }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: "Event Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}