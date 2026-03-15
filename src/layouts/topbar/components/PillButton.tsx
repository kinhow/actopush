import { Flex } from "@mantine/core";

export function PillButton({
  children,
  gap = 6,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <Flex
      align="center"
      gap={gap}
      classNames={{
        root: "rounded-md bg-octopush-elevated px-2.5 py-1.5 border border-octopush-divider cursor-pointer",
      }}
    >
      {children}
    </Flex>
  );
}
