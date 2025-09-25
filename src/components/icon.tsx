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
