type Props = {
  className?: string;
  /** Rendered height in px; width follows the mark's aspect ratio. */
  size?: number;
};

/** Path of the DealStoker "D" mark: one red stroke spiralling into a nested D. */
export const LOGO_MARK_PATH =
  "M0 11H105A81 81 0 0 1 105 173H11V53H100A39 39 0 0 1 100 131H49V87";
export const LOGO_MARK_VIEWBOX = "0 0 200 184";
export const LOGO_RED = "#EB1C24";

/** The DealStoker "D" mark, drawn as one stroked path so it stays crisp at any size. */
export function LogoMark({ className, size = 28 }: Props) {
  return (
    <svg
      className={className}
      viewBox={LOGO_MARK_VIEWBOX}
      height={size}
      width={(size * 200) / 184}
      aria-hidden="true"
      focusable="false"
    >
      <path d={LOGO_MARK_PATH} fill="none" stroke={LOGO_RED} strokeWidth="22" />
    </svg>
  );
}
