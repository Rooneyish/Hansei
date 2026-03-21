import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../api/client';
import GradientBackground from '../components/GradientBackground';
import { useMusic } from '../context/MusicContext';

const { width } = Dimensions.get('window');

const MusicScreen = ({ onBack, initialTrack }) => {
  const {
    playlist,
    loading,
    currentTrack,
    isPlaying,
    position,
    duration,
    loopMode,
    isShuffle,
    handlePlayTrack,
    togglePlayback,
    handleNext,
    handlePrevious,
    seekTo,
    setLoopMode,
    setIsShuffle,
  } = useMusic();

  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);

  const sessionStartTime = useRef(new Date()); 
  const playedTrackIds = useRef(new Set()); 

  useEffect(() => {
    if (initialTrack) {
      handlePlayTrack(initialTrack);
    }
  }, [initialTrack]);

  useEffect(() => {
    if (currentTrack?.id) {
      playedTrackIds.current.add(currentTrack.id);
    }
  }, [currentTrack?.id]);

  const saveFinalSession = async () => {
    if (playedTrackIds.current.size === 0) return;

    const endTime = new Date();
    const totalDurationSeconds = Math.floor(
      (endTime.getTime() - sessionStartTime.current.getTime()) / 1000,
    );

    try {
      await apiClient.post('/music/sessions', {
        trackIds: Array.from(playedTrackIds.current), 
        duration: totalDurationSeconds,
        startAt: sessionStartTime.current.toISOString(),
        endAt: endTime.toISOString(),
      });
      console.log('Final bulk session saved successfully.');
    } catch (error) {
      console.error('Failed to save bulk music session:', error);
    }
  };

  useEffect(() => {
    return () => {
      saveFinalSession();
    };
  }, []);

  const formatTime = secs => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderTrackItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.trackCard,
        currentTrack?.id === item.id && styles.activeTrackCard,
      ]}
      onPress={() => handlePlayTrack(item)}
    >
      <View style={styles.trackInfo}>
        <View style={styles.iconCircle}>
          <MaterialIcons
            name={
              currentTrack?.id === item.id && isPlaying
                ? 'graphic-eq'
                : 'play-arrow'
            }
            size={24}
            color="#004346"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackSubtext}>
            {item.category} • {item.artist}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setIsFullPlayerVisible(false);
              onBack();
            }}
            style={styles.backBtn}
          >
            <MaterialIcons name="chevron-left" size={32} color="#004346" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mindful Music</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#004346" />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <View style={styles.featuredCard}>
                <Text style={styles.featuredLabel}>DAILY PICK</Text>
                <Text style={styles.featuredTitle}>
                  {currentTrack?.title || playlist[0]?.title || 'Zen Focus'}
                </Text>
                <Text style={styles.featuredSub}>
                  The recommended soundscape for your Hansei practice today.
                </Text>
                <TouchableOpacity
                  style={styles.playAllBtn}
                  onPress={() => handlePlayTrack(currentTrack || playlist[0])}
                >
                  <MaterialIcons
                    name="play-circle-filled"
                    size={60}
                    color="#004346"
                  />
                </TouchableOpacity>
              </View>
            }
            data={playlist}
            keyExtractor={item => item.id.toString()}
            renderItem={renderTrackItem}
            contentContainerStyle={styles.listContent}
          />
        )}

        {currentTrack && (
          <TouchableOpacity
            style={styles.miniPlayer}
            activeOpacity={0.9}
            onPress={() => setIsFullPlayerVisible(true)}
          >
            <Image
              source={{ uri: currentTrack.artwork }}
              style={styles.miniArtwork}
            />
            <View style={styles.playerInfo}>
              <Text style={styles.miniTrackTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity onPress={togglePlayback}>
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={35}
                color="#004346"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <Modal
          visible={isFullPlayerVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsFullPlayerVisible(false)}
        >
          <View style={styles.fullPlayerContainer}>
            <GradientBackground />
            <SafeAreaView style={{ flex: 1, paddingHorizontal: 30 }}>
              <TouchableOpacity
                onPress={() => setIsFullPlayerVisible(false)}
                style={styles.closeBtn}
              >
                <MaterialIcons name="expand-more" size={40} color="#004346" />
              </TouchableOpacity>

              <Image
                source={{ uri: currentTrack?.artwork }}
                style={styles.fullArtwork}
              />

              <View style={styles.fullMeta}>
                <Text style={styles.fullTitle}>{currentTrack?.title}</Text>
                <Text style={styles.fullArtist}>{currentTrack?.artist}</Text>
              </View>

              <View style={styles.sliderContainer}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={duration}
                  value={position}
                  minimumTrackTintColor="#004346"
                  maximumTrackTintColor="rgba(0,67,70,0.2)"
                  thumbTintColor="#004346"
                  onSlidingComplete={seekTo}
                />
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              <View style={styles.controlsRow}>
                <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                  <MaterialIcons
                    name="shuffle"
                    size={28}
                    color={isShuffle ? '#004346' : 'rgba(0, 67, 70, 0.3)'}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePrevious}>
                  <MaterialIcons
                    name="skip-previous"
                    size={50}
                    color="#004346"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={togglePlayback}
                  style={styles.mainPlayBtn}
                >
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={50}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext}>
                  <MaterialIcons name="skip-next" size={50} color="#004346" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLoopMode((loopMode + 1) % 3)}
                >
                  <MaterialIcons
                    name={loopMode === 2 ? 'repeat-one' : 'repeat'}
                    size={28}
                    color={loopMode > 0 ? '#004346' : 'rgba(0, 67, 70, 0.3)'}
                  />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#004346' },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 12,
  },
  activeTrackCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: '#004346',
    borderWidth: 1,
  },
  trackInfo: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackTitle: { fontSize: 16, fontWeight: '700', color: '#004346' },
  trackSubtext: { fontSize: 12, color: '#004346', opacity: 0.5 },
  miniPlayer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 75,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 10,
  },
  miniArtwork: { width: 45, height: 45, borderRadius: 10, marginRight: 12 },
  playerInfo: { flex: 1 },
  miniTrackTitle: { fontSize: 14, fontWeight: '800', color: '#004346' },
  miniArtist: { fontSize: 12, color: '#004346', opacity: 0.6 },
  fullPlayerContainer: { flex: 1, backgroundColor: '#fff' },
  closeBtn: { alignSelf: 'center', marginTop: 10 },
  fullArtwork: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 40,
    elevation: 20,
  },
  fullMeta: { marginTop: 40, alignItems: 'center' },
  fullTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#004346',
    textAlign: 'center',
  },
  fullArtist: { fontSize: 18, color: '#004346', opacity: 0.6, marginTop: 5 },
  sliderContainer: { marginTop: 40 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  timeText: { fontSize: 12, color: '#004346', opacity: 0.5 },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  mainPlayBtn: {
    backgroundColor: '#004346',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  featuredCard: {
    margin: 5,
    marginBottom: 12,
    padding: 25,
    marginRight: 0,
    marginLeft: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    position: 'relative',
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 2,
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#004346',
    marginTop: 5,
  },
  featuredSub: {
    fontSize: 14,
    color: '#004346',
    opacity: 0.7,
    marginTop: 5,
    width: '70%',
  },
  playAllBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});

export default MusicScreen;
