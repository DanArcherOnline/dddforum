import type { PropsWithChildren } from "react";
import { Content } from "./content";
import { Header } from "./header";

export function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Header />
      <Content>{children}</Content>
    </>
  );
}
