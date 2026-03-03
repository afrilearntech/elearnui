export const metadata = {
  title: "Admin Dashboard - Liberia eLearn",
  description: "Administration panel for Liberia eLearn platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
