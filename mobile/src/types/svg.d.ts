declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const SvgComponent: React.FC<SvgProps>;
  export default SvgComponent;
}

declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const image: ImageSourcePropType;
  export default image;
}
