import type { ImgHTMLAttributes } from "react";
import React from "react";

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

const MockNextImage = React.forwardRef<HTMLImageElement, MockImageProps>(
  ({ fill: _fill, ...props }, ref) => {
    return <img ref={ref} {...props} />;
  }
);

MockNextImage.displayName = "MockNextImage";

export default MockNextImage;
