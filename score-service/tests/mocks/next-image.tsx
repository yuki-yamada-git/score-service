/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";
import React from "react";

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

const MockNextImage = React.forwardRef<HTMLImageElement, MockImageProps>(
  ({ alt = "", fill: _fill, ...props }, ref) => {
    void _fill;
    return <img ref={ref} alt={alt} {...props} />;
  },
);

MockNextImage.displayName = "MockNextImage";

export default MockNextImage;
