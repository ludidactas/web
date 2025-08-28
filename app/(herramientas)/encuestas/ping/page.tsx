import { SessionProvider } from "next-auth/react";
import PingClient from "./cliente";

export default async function PingPage() {
  return (
    <SessionProvider>
      <PingClient />
    </SessionProvider>
  )
}