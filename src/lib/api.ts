import { Capacitor } from "@capacitor/core";

// Determine the API base URL.
// When running in a native Android environment (Capacitor), relative URLs won't work out of the box because the app is hosted on capacitor://localhost or http://localhost.
// So we provide a configurable base URL from localStorage, or fall back to the public production web URL, or use window.location.origin on web.
export function getApiUrl(path: string): string {
  // Safe check for path leading slash
  const formattedPath = path.startsWith("/") ? path : `/${path}`;

  // Check if we are running natively under Capacitor
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // Check if the user specified a custom host in settings, otherwise default to the shared web app production URL
    const customHost = localStorage.getItem("MEDISPARK_CUSTOM_API_HOST");
    if (customHost) {
      const sanitizedHost = customHost.endsWith("/") ? customHost.slice(0, -1) : customHost;
      return `${sanitizedHost}${formattedPath}`;
    }
    // Default to our deployment URL so the Android/iOS apps work out-of-the-box with the live backend
    // Updated to the user's specific domain
    const prodUrl = "https://medispark.com";
    return `${prodUrl}${formattedPath}`;
  }

  // On standard web browser, relative path is perfect
  return formattedPath;
}
