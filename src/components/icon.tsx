import { clsx } from "clsx";

export type IconName =
  | "loading"
  | "house"
  | "house-fill"
  | "clipboard"
  | "clipboard-fill"
  | "gear"
  | "gear-fill"
  | "pushup"
  | "pullup"
  | "abs"
  | "squat"
  | "chevron-down"
  | "chevron-up"
  | "close"
  | "plus";

type IconProps = React.SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export const Icon = ({
  name,
  size = 24,
  ...props
}: IconProps & React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={size} height={size} {...props}>
      <use
        xlinkHref={`${import.meta.env.BASE_URL}icons-sprite.svg#icon__${name}`}
      />
    </svg>
  );
};

export const ProgressIcon = ({
  name,
  progress,
  size = 24,
  strokeWidth = 4,
  className,
  ...props
}: {
  name: IconName;
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
} & React.SVGProps<SVGSVGElement>) => {
  const CENTER = size / 2;
  const R = CENTER - strokeWidth / 2;
  const iconSize = size * 0.6;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={clsx(className)}
      {...props}
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        fill="none"
        stroke="#e6e6e6"
        strokeWidth={strokeWidth}
      />
      {progress > 0 && (
        <circle
          style={{
            strokeDasharray: 100,
            strokeDashoffset: 100 - progress * 100,
          }}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          pathLength="100"
          strokeLinecap="round"
        />
      )}
      <g
        transform={`translate(${CENTER} ${CENTER}) scale(${
          iconSize / 45
        }) translate(-${CENTER} -${CENTER})`}
      >
        <use
          xlinkHref={`${
            import.meta.env.BASE_URL
          }icons-sprite.svg#icon__${name}`}
        />
      </g>
    </svg>
  );
};
