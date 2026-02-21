import { DesktopShell } from "@/app/_components/desktop-shell";

interface DesktopPageProps {
  params: Promise<{ route?: string[] }>;
}

export default async function DesktopPage({ params }: DesktopPageProps) {
  const { route = [] } = await params;
  const initialPathname =
    route.length === 0
      ? "/"
      : `/${route.map((segment) => encodeURIComponent(segment)).join("/")}`;
  return <DesktopShell initialPathname={initialPathname} />;
}
