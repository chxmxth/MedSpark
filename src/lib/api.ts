// Determine the API base URL.
// When running in a native Android environment (Capacitor), relative URLs won't work out of the box because the app is hosted on capacitor://localhost or http://localhost.
// So we provide a configurable base URL from localStorage, or fall back to the public production web URL, or use window.location.origin on web.
export function getApiUrl(path: string): string {
  // Safe check for path leading slash
  const formattedPath = path.startsWith("/") ? path : `/${path}`;

  // Check if we are running under Capacitor
  const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor;

  if (isCapacitor) {
    // Check if the user specified a custom host in settings, otherwise default to the shared web app production URL
    const customHost = localStorage.getItem("MEDISPARK_CUSTOM_API_HOST");
    if (customHost) {
      const sanitizedHost = customHost.endsWith("/") ? customHost.slice(0, -1) : customHost;
      return `${sanitizedHost}${formattedPath}`;
    }
    // Default to our deployment URL so the Android app works out-of-the-box with the live backend
    const prodUrl = "https://ais-pre-cruun4mnfixl3rrlflmaov-39922660239.asia-southeast1.run.app";
    return `${prodUrl}${formattedPath}`;
  }

  // On standard web browser, relative path is perfect
  return formattedPath;
}
