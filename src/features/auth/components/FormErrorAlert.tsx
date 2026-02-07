import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

type FormErrorAlertProps = {
  message: string | undefined;
};

export function FormErrorAlert({ message }: FormErrorAlertProps) {
  if (!message) return null;

  return (
    <Alert
      w="100%"
      radius="md"
      color="red"
      bg="var(--color-octopush-error-bg)"
      icon={<IconAlertCircle size={16} />}
    >
      {message}
    </Alert>
  );
}
