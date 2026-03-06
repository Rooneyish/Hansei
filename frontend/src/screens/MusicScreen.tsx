import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  // Dimensions,
  ActivityIndicator,
} from 'react-native';
import TrackPlayer, {
  usePlaybackState,
  State,
  Capability,
} from 'react-native-track-player';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import ChatOverlay from '../components/ChatOverlay';
import apiClient from '../api/client';

const MusicScreen = ({ onBack }) => {
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const playbackState = usePlaybackState();
  const isPlaying =
    playbackState === State.Playing ||
    (typeof playbackState === 'object' &&
      playbackState.state === State.Playing);

  useEffect(() => {
    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
          ],
        });
      } catch (e) {}
    };
    setupPlayer();
  }, []);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await apiClient.get('/music/all');
        setPlaylist(response.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMusic();
  }, []);

  const handlePlayTrack = async track => {
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: track.id.toString(),
        url: track.url,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
      });
      await TrackPlayer.play();
      setCurrentTrack(track);
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
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
      <MaterialIcons name="more-vert" size={24} color="rgba(0, 67, 70, 0.4)" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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
          <>
            <View style={styles.featuredCard}>
              <Text style={styles.featuredLabel}>DAILY PICK</Text>
              <Text style={styles.featuredTitle}>
                {playlist[0]?.title || 'Zen Focus'}
              </Text>
              <Text style={styles.featuredSub}>
                A curated soundscape for your Hansei practice.
              </Text>
              <TouchableOpacity
                style={styles.playAllBtn}
                onPress={() => playlist[0] && handlePlayTrack(playlist[0])}
              >
                <MaterialIcons
                  name="play-circle-filled"
                  size={60}
                  color="#004346"
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={playlist}
              keyExtractor={item => item.id.toString()}
              renderItem={renderTrackItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {currentTrack && (
          <View style={styles.miniPlayer}>
            <View style={styles.playerInfo}>
              <Image
                source={{ uri: currentTrack.artwork }}
                style={styles.miniArtwork}
              />
              <Text style={styles.miniTrackTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.playerControls}>
              <TouchableOpacity onPress={togglePlayback}>
                <MaterialIcons
                  name={
                    isPlaying ? 'pause-circle-filled' : 'play-circle-filled'
                  }
                  size={50}
                  color="#004346"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
      <ChatOverlay
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
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
  featuredCard: {
    margin: 20,
    padding: 25,
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
  playAllBtn: { position: 'absolute', right: 20, bottom: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 150 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeTrackCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: '#004346',
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
    bottom: 30,
    left: 20,
    right: 20,
    height: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  playerInfo: { flex: 1, marginRight: 10 },
  miniTrackTitle: { fontSize: 16, fontWeight: '800', color: '#004346' },
  miniArtist: { fontSize: 12, color: '#004346', opacity: 0.6 },
  playerControls: { justifyContent: 'center' },
  miniArtwork: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 15,
  },
});

export default MusicScreen;
