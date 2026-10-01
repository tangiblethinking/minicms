import type { Ref } from "react";

type PreviewFrameProps = {
  srcDoc: string;
  title?: string;
  testId?: string;
  transparent?: boolean;
  frameRef?: Ref<HTMLIFrameElement>;
};

export function PreviewFrame({
  srcDoc,
  title = "Design system sample",
  testId = "sample-frame",
  transparent = false,
  frameRef,
}: PreviewFrameProps) {
  return (
    <iframe
      ref={frameRef}
      title={title}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      data-testid={testId}
      className={`h-full min-h-[28rem] w-full rounded-sm border-0 ${transparent ? "bg-transparent" : "bg-panel"}`}
    />
  );
}
