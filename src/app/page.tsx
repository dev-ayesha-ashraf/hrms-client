import Image from "next/image";
import logo from '../../public/logo.png';

export default function Home() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-center items-center px-8 text-center">
      {/* Logo */}
      <div className="mb-8">
        <Image src={logo} alt="HR Solutions Logo" width={150} height={150} />
      </div>

      {/* Headline */}
      <h1 className="text-primary text-5xl sm:text-6xl font-extrabold mb-4 drop-shadow-md">
        Welcome to HR Solutions
      </h1>

      {/* Subheading */}
      <p className="text-secondary text-xl sm:text-2xl max-w-2xl mb-8">
        We provide the best HR tools for your company. Simplify your HR processes and empower your team.
      </p>

      {/* CTA Button */}
      <button className="bg-accent text-secondary font-semibold px-8 py-3 rounded-full hover:bg-primary hover:text-background transition-all duration-300 shadow-lg transform hover:scale-105">
        Get Started
      </button>
    </div>
  );
}