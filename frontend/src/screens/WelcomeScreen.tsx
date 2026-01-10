import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet, Easing, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';

const WelcomeScreen = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const startRotation = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation());
    };
    startRotation();
  }, [fadeAnim, rotateAnim, scaleAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <GradientBackground />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.innerContent,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.logoWrapper}>
            <Animated.Image
              source={require('../assets/logo_dark.png')}
              style={[styles.logo, { transform: [{ rotate: spin }] }]}
            />
          </View>

          <Text style={styles.title}>Hansei</Text>

          <View style={styles.loaderContainer}>
            <Text style={styles.subtitle}>Aligning your thoughts</Text>
            <View style={styles.dotContainer}>
              <Animated.View style={styles.loadingBar} />
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5F3F3',
  },
  safeArea: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    shadowColor: '#004346',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    marginBottom: 30,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#004346',
    letterSpacing: -1,
  },
  loaderContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  subtitle: {
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  dotContainer: {
    width: 100,
    height: 3,
    backgroundColor: 'rgba(0, 67, 70, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    width: '40%',
    height: '100%',
    backgroundColor: '#004346',
    borderRadius: 2,
  },
});

export default WelcomeScreen;
