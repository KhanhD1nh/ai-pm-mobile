import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { resolveExternalPath } from "@/features/navigation/public";
import { useAuth } from "@/providers/auth-provider";
import { sessionStorage } from "@/infrastructure/auth/session-storage";

export function DeepLinkBootstrap() {
  const { ready, user } = useAuth();
  const userRef = useRef(user);
  const initialUrlHandled = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !active) return;
      const destination = resolveExternalPath(url);
      if (!destination) return;
      if (!userRef.current) {
        await sessionStorage.setPendingDestination(destination);
        if (active) router.replace("/login");
        return;
      }
      if (active) router.push(destination as never);
    };

    // Linking.getInitialURL() returns the same launch URL for the lifetime of
    // the app process. Auth state changes after login must not replay it and
    // push a second copy of the pending destination onto the stack.
    if (!initialUrlHandled.current) {
      initialUrlHandled.current = true;
      void Linking.getInitialURL().then(handleUrl);
    }
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [ready]);

  return null;
}
