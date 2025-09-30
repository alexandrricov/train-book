import { clsx } from "clsx";
import {
  NavLink as RouterNavLink,
  type NavLinkProps as RouterNavLinkProps,
} from "react-router";
import { Icon, type IconName } from "./icon";

type BaseProps = {
  children: React.ReactNode;
  icon?: {
    name: IconName;
    position?: "left" | "right" | "only";
  };
  size?: "small" | "medium" | "large";
  variation: "primary" | "secondary";
};

export function Button({
  children,
  variation,
  size,
  icon,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & BaseProps) {
  return (
    <button
      className={clsx(
        buttonStyles({
          variation,
          size,
          iconPosition: icon?.position,
          disabled: props.disabled,
        }),
        className
      )}
      {...(icon?.position === "only" ? { title: children?.toString() } : {})}
      {...props}
    >
      <InnerContent icon={icon} size={size} variation={variation}>
        {children}
      </InnerContent>
    </button>
  );
}

export function NavLink({
  children,
  variation,
  size,
  icon,
  className,
  ...props
}: RouterNavLinkProps & BaseProps) {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        clsx(
          buttonStyles({
            variation,
            // size,
            iconPosition: icon?.position,
            disabled: !props.to,
            isActive,
          }),
          className
        )
      }
      {...(icon?.position === "only" ? { title: children?.toString() } : {})}
      {...props}
    >
      <InnerContent icon={icon} size={size} variation={variation}>
        {children}
      </InnerContent>
    </RouterNavLink>
  );
}

function buttonStyles({
  variation = "primary",
  size = "medium",
  iconPosition,
  disabled,
  isActive,
}: {
  variation: BaseProps["variation"];
  size?: BaseProps["size"];
  iconPosition?: "left" | "right" | "only";
  disabled?: boolean;
  isActive?: boolean;
}) {
  return clsx(
    "flex w-fit items-center justify-center rounded-lg",
    "cursor-pointer  [transition:all_150ms_ease-out]",
    disabled && ["cursor-not-allowed opacity-50 pointer-events-none"],
    variation === "primary" && [
      "rounded-xl bg-brand text-white",
      "hover:bg-brand-light",
      isActive && "",
    ],
    variation === "secondary" && [
      "rounded-xl bg-canvas text-brand",
      "hover:bg-canvas2 hover:text-canvas-text",
      isActive && "",
    ],
    size === "large" &&
      `${iconPosition === "only" ? "p-3" : "px-6 py-3"} font-medium`,
    size === "medium" &&
      `${iconPosition === "only" ? "p-2" : "px-4 py-2"} font-medium`,
    size === "small" &&
      `${iconPosition === "only" ? "p-1" : "px-2 py-1"} font-medium`
  );
}

const InnerContent = ({
  icon,
  size = "medium",
  variation,
  children,
}: {
  icon?: BaseProps["icon"];
  size?: BaseProps["size"];
  variation: BaseProps["variation"];
  children: React.ReactNode;
}) => {
  if (!icon) {
    return <>{children}</>;
  }

  let iconSize = 20;
  if (size === "large") {
    iconSize = 24;
  } else if (size === "small") {
    iconSize = 16;
  }

  return (
    <>
      {icon.position === "left" && (
        <Icon
          name={icon.name}
          size={iconSize}
          className={clsx(variation.startsWith("link-") ? "mr-1" : "mr-2", {
            "animate-spin": icon.name === "loading",
          })}
        />
      )}
      {icon.position === "only" ? (
        <>
          <Icon
            name={icon.name}
            size={iconSize}
            className={clsx({
              "animate-spin": icon.name === "loading",
            })}
          />
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
      {icon.position === "right" && (
        <Icon
          name={icon.name}
          size={iconSize}
          className={clsx(variation.startsWith("link-") ? "ml-1" : "ml-2", {
            "animate-spin": icon.name === "loading",
          })}
        />
      )}
    </>
  );
};
