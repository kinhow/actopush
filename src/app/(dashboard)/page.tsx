import { ThemeToggle } from "@/components/ThemeToggle";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

const Home = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex items-center gap-2">
        <SignOutButton />
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Home;
