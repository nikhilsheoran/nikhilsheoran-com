import type { ComponentProps } from "react";

/**
 * Shared MDX component overrides used by both desktop and mobile Notes views.
 * Accepts a CSS modules styles object so each consumer can provide its own theme.
 */
export function createMdxComponents(styles: Record<string, string>) {
  return {
    h1: (props: ComponentProps<"h1">) => (
      <h1 className={styles.mdxH1} {...props} />
    ),
    h2: (props: ComponentProps<"h2">) => (
      <h2 className={styles.mdxH2} {...props} />
    ),
    h3: (props: ComponentProps<"h3">) => (
      <h3 className={styles.mdxH3} {...props} />
    ),
    a: (props: ComponentProps<"a">) => (
      <a
        className={styles.inlineLink}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    code: (props: ComponentProps<"code">) => (
      <code className={styles.inlineCode} {...props} />
    ),
    pre: (props: ComponentProps<"pre">) => (
      <pre className={styles.codeBlock} {...props} />
    ),
  };
}
