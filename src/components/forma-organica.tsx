export function FormaOrganica({
  color,
  className = "",
  opacity = 0.3,
}: {
  color: "green" | "blue";
  className?: string;
  opacity?: number;
}) {
  const fill = color === "green" ? "#96ceb7" : "#61c5f1";
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 200 200"
      style={{ opacity }}
    >
      <path
        fill={fill}
        d="M45.3,-58.6C58.5,-49.3,68.6,-34.6,72.1,-18.3C75.7,-2,72.7,15.9,63.9,29.9C55.1,43.9,40.5,54,24.4,60.6C8.3,67.2,-9.3,70.3,-24.8,65.6C-40.3,60.9,-53.7,48.3,-61.8,32.9C-69.9,17.5,-72.7,-0.7,-68.1,-16.7C-63.5,-32.7,-51.5,-46.5,-37.2,-55.4C-22.9,-64.3,-11.4,-68.3,2.9,-72.1C17.3,-75.9,34.5,-79.5,45.3,-58.6Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
