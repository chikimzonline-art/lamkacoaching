'use client';

import { useTheme } from 'next-themes';

interface WaveDividerProps {
  /** Shape type */
  type?: 'wave' | 'curve' | 'tilt' | 'none';
  /** Fill color for light mode (hex) — matches the section below */
  fillLight?: string;
  /** Fill color for dark mode (hex) — matches the section below */
  fillDark?: string;
  /** Flip the wave vertically */
  flip?: boolean;
  /** Additional class names */
  className?: string;
}

export default function WaveDivider({
  type = 'wave',
  fillLight = '#ffffff',
  fillDark = '#111827',
  flip = false,
  className = '',
}: WaveDividerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const svgFill = isDark ? fillDark : fillLight;
  const scaleY = flip ? -1 : 1;

  if (type === 'none') return null;

  const renderShape = () => {
    switch (type) {
      case 'wave':
        return (
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="block w-full h-[50px] sm:h-[70px] lg:h-[80px]"
            style={{ transform: `scaleY(${scaleY})` }}
          >
            <path
              d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
              fill={svgFill}
            />
          </svg>
        );
      case 'curve':
        return (
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="block w-full h-[35px] sm:h-[50px] lg:h-[60px]"
            style={{ transform: `scaleY(${scaleY})` }}
          >
            <path
              d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z"
              fill={svgFill}
            />
          </svg>
        );
      case 'tilt':
        return (
          <svg
            viewBox="0 0 1440 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="block w-full h-[20px] sm:h-[30px] lg:h-[40px]"
            style={{ transform: `scaleY(${scaleY})` }}
          >
            <path
              d="M0 40L1440 0V40H0Z"
              fill={svgFill}
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${className}`}
      aria-hidden="true"
    >
      {renderShape()}
    </div>
  );
}
