import { SessionProvider } from "next-auth/react";
import PingClient from "./ping";
import TestClient from "./cliente";

export default async function PingPage() {

  return (
    <SessionProvider>
      <TestClient />
    </SessionProvider>
  )
}