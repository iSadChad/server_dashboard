import "./globals.css";

export const metadata = {
  title: "Chad's Goon Cave",
  description: "Private server dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">{children}</body>
    </html>
  );
}
