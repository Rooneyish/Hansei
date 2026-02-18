import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const NavigationBar = ({
  onNavigateHome,
  onNavigateProfile,
  onNavigateInsights,
  onNavigateChatHistory,
  onPressAI,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.navContainer}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateHome}>
          <MaterialIcons name="home-filled" size={28} color="#004346" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateInsights}>
          <MaterialIcons
            name="bubble-chart"
            size={28}
            color="rgba(0, 67, 70, 0.5)"
          />
        </TouchableOpacity>

        <View style={styles.aiButtonWrapper}>
          <Animated.View
            style={[
              styles.aiButtonCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity activeOpacity={0.9} style={styles.aiButtonInner} onPress={onPressAI}>
              <Image
                source={require('../assets/logo_light.png')}
                style={styles.aiLogo}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateChatHistory}>
          <MaterialIcons
            name="history"
            size={28}
            color="rgba(0, 67, 70, 0.5)"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateProfile}>
          <MaterialIcons name="person-outline" size={28} color="#004346" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    height: 75,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#004346',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: { flex: 1, alignItems: 'center' },
  aiButtonWrapper: { marginTop: -60 },
  aiButtonCircle: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: 'rgba(213, 243, 243, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004346',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  aiLogo: { width: 40, height: 40, resizeMode: 'contain' },
});

export default NavigationBar;
