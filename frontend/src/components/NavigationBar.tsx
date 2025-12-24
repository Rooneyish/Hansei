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
  onNavigateSettings,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.navBar}>
      <NavItem icon="home" onPress={onNavigateHome} />
      <NavItem icon="bar-chart" onPress={onNavigateInsights} />
      <View style={styles.aiButtonContainer}>
        <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]} />
        <TouchableOpacity activeOpacity={0.8} style={styles.aiButton}>
          <View style={styles.aiButtonInner}>
            <Image
              source={require('../assets/logo_light.png')}
              style={styles.smallLogo}
            />
          </View>
        </TouchableOpacity>
      </View>
      <NavItem icon="settings" onPress={onNavigateSettings} />
      <NavItem icon="person" onPress={onNavigateProfile} />
    </View>
  );
};

const NavItem = ({ icon, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <MaterialIcons name={icon} size={32} color="rgba(23, 43, 58, 0.82)" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 15,
    left: 10,
    right: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 43, 58, 0.5)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  aiButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -45,
  },
  aiButton: {
    width: 60,
    height: 60,
    padding: 3,
  },
  aiButtonInner: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#004346',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
});

export default NavigationBar;
