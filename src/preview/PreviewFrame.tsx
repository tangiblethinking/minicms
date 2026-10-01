type PreviewFrameProps = {
  srcDoc: string;
};

export function PreviewFrame({ srcDoc }: PreviewFrameProps) {
  return (
    <iframe
      title="Design system sample"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      data-testid="sample-frame"
      className="h-full min-h-[28rem] w-full rounded-sm border-0 bg-panel"
    />
  );
}
