export function Avatar({
  name,
  photoURL,
  size = 40,
}: {
  name: string;
  photoURL: string | null;
  size?: number;
}) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className="rounded-full object-cover shrink-0 bg-canvas2"
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="rounded-full bg-canvas2 text-muted font-medium flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}
