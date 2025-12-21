import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet, Easing, View, SafeAreaView } from 'react-native';
import GradientBackground from '../components/GradientBackground';

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
        duration: 2000,
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
    <View style={styles.container}>
      <GradientBackground />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.innerContent, { opacity: fadeAnim }]}>
          <Animated.Image
            source={require('../assets/logo_dark.png')} 
            style={[styles.logo, { transform: [{ rotate: spin }] }]}
          />
          <Text style={styles.title}>Hansei</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004346', 
  },
  safeArea: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180, 
    height: 180,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#172a3a', 
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: 10,
    color: '#508991', 
    letterSpacing: 4,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase', 
  },
});

export default WelcomeScreen;