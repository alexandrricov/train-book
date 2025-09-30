import clsx from "clsx";
import { cloneElement, useState } from "react";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  type Placement,
  type ReferenceType,
} from "@floating-ui/react";
// import { Icon, type IconName } from "./icon";
import ReactDOM from "react-dom";
// import { Link } from "react-router-dom";

export function Dropdown({
  children,
  target,
  placement = "bottom-start",
  className,
  portal,
}: {
  children:
    | React.ReactNode
    | ((
        setOpen: React.Dispatch<React.SetStateAction<boolean>>
      ) => React.ReactNode);
  target(
    ref: (node: ReferenceType | null) => void,
    toggle: () => void,
    open: boolean
  ): React.ReactElement;
  placement?: Placement;
  className?: string;
  portal?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
    strategy: "fixed",
  });

  const dismiss = useDismiss(context, {
    outsidePress: true,
    outsidePressEvent: "pointerdown",
    escapeKey: true,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const content = (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      {...getFloatingProps()}
      className={clsx(
        "shadow-[inset_0_0_0_1px_theme(colors.grey.200),0_16px_32px_-12px_#61616B1A] dark:shadow-[inset_0_0_0_1px_theme(colors.grey.800),0_16px_32px_-12px_#03040752] bg-canvas z-10 rounded-2xl p-2",
        className
      )}
    >
      {children instanceof Function ? children(setOpen) : children}
    </div>
  );

  return (
    <>
      {cloneElement(
        target(refs.setReference, () => setOpen((_) => !_), open),
        {
          ...getReferenceProps(),
        }
      )}
      {open &&
        (portal ? ReactDOM.createPortal(content, document.body) : content)}
    </>
  );
}
