import React from 'react';

// Import all images statically to ensure they're included in the build
import bitcoinImage from '../assets/bitcoin.png';
import rocketImage from '../assets/rocket.png';
import richImage from '../assets/rich.png';

type ImageType = 'bitcoin' | 'rocket' | 'rich';

interface GameImageProps {
  type: ImageType;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

// Map of image types to their static imports
const imageMap: Record<ImageType, string> = {
  bitcoin: bitcoinImage,
  rocket: rocketImage,
  rich: richImage
};

const GameImage: React.FC<GameImageProps> = ({ 
  type, 
  width = 120, 
  height = 120, 
  className = 'object-contain',
  alt = type
}) => {
  return (
    <img 
      src={imageMap[type]} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
    />
  );
};

export default GameImage;