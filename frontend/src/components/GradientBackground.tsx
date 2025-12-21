import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, BlurMask } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

const GradientBackground = () => {
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Circle cx={width / 2} cy={height / 2} r={height} color="#004346" />

      <Circle cx={width * 0.2} cy={height * 0.3} r={width * 0.8} color="#D5F3F3">
        <BlurMask blur={100} style="normal" />
      </Circle>

      <Circle cx={width * 0.9} cy={height * 0.5} r={width * 0.7} color="#D5F2DF">
        <BlurMask blur={120} style="normal" />
      </Circle>

      <Circle cx={width * 0.1} cy={height * 0.9} r={width * 0.6} color="#D5E9F2">
        <BlurMask blur={80} style="normal" />
      </Circle>
    </Canvas>
  );
};

export default GradientBackground;

