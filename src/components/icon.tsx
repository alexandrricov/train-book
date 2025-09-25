import { clsx } from "clsx";

export type IconName =
  | "loading"
  | "home"
  | "notebook"
  | "gear"
  | "pushup"
  | "pullup"
  | "abs"
  | "squat"
  | "chevron-down"
  | "chevron-up";

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
  className,
  ...props
}: {
  name: IconName;
  progress: number;
  size?: number;
} & React.SVGProps<SVGSVGElement>) => {
  const R = 54;
  const CENTER = 60;
  const iconSize = size * 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={clsx(className)}
      {...props}
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        fill="none"
        stroke="#e6e6e6"
        stroke-width="12"
      />
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
        stroke-width="12"
        pathLength="100"
      />
      <g
        transform={`translate(${CENTER} ${CENTER}) scale(${
          iconSize / 50
        }) translate(-60 -60)`}
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
