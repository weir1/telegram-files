import { useSettings } from "@/hooks/use-settings";
import { type ReactNode, useMemo } from "react";
import { Spoiler } from "spoiled";

export default function SpoiledWrapper({
  hasSensitiveContent,
  children,
}: {
  hasSensitiveContent: boolean;
  children: ReactNode;
}) {
  const { settings } = useSettings();
  const hidden = useMemo(() => true, []);
  const showSensitiveContent = useMemo(
    () => settings?.showSensitiveContent === "true",
    [settings?.showSensitiveContent],
  );

  if (
    settings?.alwaysHide === "true" ||
    (hasSensitiveContent && !showSensitiveContent)
  ) {
    return (
      <Spoiler hidden={hidden} className="pointer-events-none">
        {children}
      </Spoiler>
    );
  }

  return <>{children}</>;
}
