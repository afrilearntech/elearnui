"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * True after client checks `auth_token` in localStorage. Redirects to login if missing.
 */
export function useStudentAuthReady(loginPath = "/login") {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push(loginPath);
      return;
    }
    setReady(true);
  }, [router, loginPath]);

  return ready;
}
