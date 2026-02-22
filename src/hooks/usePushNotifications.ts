import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";

/**
 * Hook to register for push notifications via Capacitor.
 * Call this once at the app root level.
 * 
 * Requires @capacitor/push-notifications to be installed.
 * This is a no-op in web browsers — only activates on native iOS/Android.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  const registerToken = useCallback(
    async (token: string, platform: "ios" | "android") => {
      if (!user) return;

      // Upsert the device token
      await supabase.from("device_tokens").upsert(
        {
          user_id: user.id,
          token,
          platform,
        },
        { onConflict: "user_id,token" }
      );
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    let cleanup: (() => void) | undefined;

    async function init() {
      try {
        // Dynamic import so this doesn't break in web browsers
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );
        const { Capacitor } = await import("@capacitor/core");

        if (!Capacitor.isNativePlatform()) return;

        const platform = Capacitor.getPlatform() as "ios" | "android";

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") {
          console.log("Push notification permission not granted");
          return;
        }

        // Register with APNs / FCM
        await PushNotifications.register();

        // Listen for registration success
        const regListener = await PushNotifications.addListener(
          "registration",
          (token) => {
            console.log("Push token received:", token.value);
            registerToken(token.value, platform);
          }
        );

        // Listen for registration errors
        const errListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            console.error("Push registration error:", err);
          }
        );

        // Listen for incoming notifications while app is open
        const recvListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("Push received in foreground:", notification);
            // Could show an in-app toast here
          }
        );

        // Listen for notification tap (app opened from notification)
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("Push action performed:", action);
            // Could navigate to relevant screen based on action.notification.data
          }
        );

        cleanup = () => {
          regListener.remove();
          errListener.remove();
          recvListener.remove();
          actionListener.remove();
        };
      } catch {
        // Not on a native platform or plugin not installed — silently ignore
      }
    }

    init();

    return () => cleanup?.();
  }, [user, registerToken]);
}
