import NextAuth from "next-auth";
import { adminAuthOptions } from "@/lib/auth";

// Override admin auth to use custom callback URL
const handler = NextAuth({
  ...adminAuthOptions,
  callbacks: {
    ...adminAuthOptions.callbacks,
    async redirect({ url, baseUrl }) {
      // Always redirect to admin after admin login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/ueadmin/dashboard`;
      }
      return url;
    },
  },
});

export { handler as GET, handler as POST };