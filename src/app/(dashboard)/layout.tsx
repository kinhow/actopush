import { Box, Flex } from "@mantine/core";
import { Sidebar } from "@/layouts/sidebar/components/Sidebar";
import { TopBar } from "@/layouts/topbar/components/TopBar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Flex direction="column" h="100vh" className="bg-octopush-base">
      <TopBar />
      <Flex flex={1} style={{ overflow: "hidden" }}>
        <Sidebar />
        <Box component="main" flex={1} style={{ overflowY: "auto" }}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
