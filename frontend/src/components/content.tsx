import type { PropsWithChildren } from "react";

export function Content({ children }: PropsWithChildren) {
  return <div className="content-container">{children}</div>;
}
