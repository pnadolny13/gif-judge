import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#1a1a1a',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'GIF Battle',
          }}
        />
        <Stack.Screen
          name="create"
          options={{
            title: 'Create Game',
          }}
        />
        <Stack.Screen
          name="join"
          options={{
            title: 'Join Game',
          }}
        />
        <Stack.Screen
          name="lobby"
          options={{
            title: 'Game Lobby',
          }}
        />
        <Stack.Screen
          name="game"
          options={{
            title: 'GIF Battle',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="waiting"
          options={{
            title: 'Waiting',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="results"
          options={{
            title: 'Round Results',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="game-over"
          options={{
            title: 'Game Over',
            headerBackVisible: false,
          }}
        />
      </Stack>
    </>
  );
}
