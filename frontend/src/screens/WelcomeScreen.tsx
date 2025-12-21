import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet, Easing } from 'react-native';

const WelcomeScreen = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const startRotation = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation());
    };
    startRotation();
  }, [fadeAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.Image
        source={require('../assets/logo_dark.png')}
        style={[styles.logo, { transform: [{ rotate: spin }] }]}
      />
      <Text style={styles.title}>Hansei</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#d6f3f4' },
  logo: { width: 200, height: 200, marginBottom: 20, resizeMode: 'contain' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  subtitle: { marginTop: 10, color: '#666', letterSpacing: 2 },
});

export default WelcomeScreen;