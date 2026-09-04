import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

export function bindOnlineManager() {
  return NetInfo.addEventListener((state) => {
    onlineManager.setOnline(Boolean(state.isConnected));
  });
}
