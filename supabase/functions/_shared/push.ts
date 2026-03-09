const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendExpoPush(
  token: string,
  title: string,
  body: string
): Promise<boolean> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: "default"
    })
  });
  return res.ok;
}
