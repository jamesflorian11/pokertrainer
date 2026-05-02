import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
