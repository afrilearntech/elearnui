import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Content Management - Liberia eLearn",
  description: "Content management system for Liberia eLearn platform",
};

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        containerClassName="!z-[9999]"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "Poppins, sans-serif",
            padding: "16px 20px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
          },
        }}
      />
    </>
  );
}
