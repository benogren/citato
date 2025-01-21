import Link from "next/link";

export default async function Layout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="h-screen flex items-centerflex justify-center items-center mx-auto">
        <div>
          <p className="text-center m-6">
              <Link href={"/"} className="font-bold text-xl text-gray-600">citato.ai</Link>
          </p>
          <hr className="w-4/6 mx-auto mb-6" />
          {children}
        </div>
      </div>
    );
  }