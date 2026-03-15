export function Bar({
  height,
  color,
  maxVal,
  maxHeight,
}: {
  height: number;
  color: string;
  maxVal: number;
  maxHeight: number;
}) {
  return (
    <div
      className="rounded-t-sm w-full min-w-0"
      style={{
        height: `${(height / maxVal) * maxHeight}px`,
        backgroundColor: color,
      }}
    />
  );
}
